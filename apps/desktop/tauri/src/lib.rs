use tauri::{
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager,
};

use std::io::Read;
use std::net::IpAddr;

/// GitHub OAuth App Client ID — baked in at compile time.
/// Set the GITHUB_CLIENT_ID environment variable before building.
const GITHUB_CLIENT_ID: &str = match option_env!("GITHUB_CLIENT_ID") {
    Some(id) => id,
    None => "",
};

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct WslDistro {
    name: String,
    state: String,
    version: String,
    default: bool,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct WslInfo {
    installed: bool,
    version: String,
    default_distro: String,
    distributions: Vec<WslDistro>,
    error: Option<String>,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct PentestToolStatus {
    tool_id: String,
    installed: bool,
    command: String,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct PentestRunResult {
    action: String,
    command: String,
    output: String,
}

#[derive(Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct AcademyTerminalEvent {
    run_id: String,
    stream: String,
    text: String,
    done: bool,
    code: Option<i32>,
}

// ── SSRF guard ────────────────────────────────────────────────────────────────

/// Hosts that `download_to_temp` is permitted to reach (and redirect through).
/// This command exists solely to download HuggingFace model files for the Kokoro
/// TTS feature; any other host is out of scope and must be rejected.
const ALLOWED_DOWNLOAD_HOSTS: &[&str] = &[
    "huggingface.co",
    "cdn-lfs.huggingface.co",
    "cdn-lfs-us-1.huggingface.co",
    "cdn-lfs-us-2.huggingface.co",
    "hf.co",
];

fn is_allowed_download_host(host: &str) -> bool {
    let lower = host.to_lowercase();
    ALLOWED_DOWNLOAD_HOSTS.iter().any(|&h| lower == h)
}

/// Returns `Err` if `host` must be blocked to prevent SSRF.
///
/// Rejects well-known internal hostnames first (no network needed), then
/// resolves via DNS and rejects any result that maps to a loopback, private,
/// link-local, or cloud-metadata address.  Called before every new connection
/// **and** after every redirect, so SSRF-via-redirect chains are also blocked.
async fn ssrf_check(host: &str) -> Result<(), String> {
    // Block common internal hostnames before touching DNS
    let lower = host.to_lowercase();
    const BLOCKED_NAMES: &[&str] = &[
        "localhost",
        "local",
        "metadata.google.internal",
        "metadata.goog",
        "0.0.0.0",
        "::1",
        "127.0.0.1",
    ];
    if BLOCKED_NAMES.contains(&lower.as_str())
        || lower.ends_with(".localhost")
        || lower.ends_with(".local")
        || lower.ends_with(".internal")
    {
        return Err(format!("Host '{}' is not permitted.", host));
    }

    // DNS-resolve and inspect every returned address
    let owned = host.to_owned();
    let addrs = tauri::async_runtime::spawn_blocking(move || {
        use std::net::ToSocketAddrs;
        format!("{}:80", owned)
            .to_socket_addrs()
            .map(|i| i.collect::<Vec<_>>())
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e| format!("Cannot resolve host '{}': {}", host, e))?;

    for addr in addrs {
        if is_blocked_ip(addr.ip()) {
            return Err(format!(
                "Host '{}' resolves to a private or reserved IP address and is not permitted.",
                host,
            ));
        }
    }
    Ok(())
}

/// Returns `true` for any IP that must not be reachable from a renderer-triggered
/// HTTP request: loopback, RFC-1918 private, link-local (169.254/16 covers AWS
/// IMDSv1), broadcast, multicast, unspecified, and their IPv6 equivalents.
fn is_blocked_ip(ip: IpAddr) -> bool {
    match ip {
        IpAddr::V4(v4) => {
            v4.is_loopback()
                || v4.is_private()
                || v4.is_link_local()
                || v4.is_broadcast()
                || v4.is_multicast()
                || v4.is_unspecified()
        }
        IpAddr::V6(v6) => {
            if v6.is_loopback() || v6.is_unspecified() || v6.is_multicast() {
                return true;
            }
            let s = v6.segments();
            // Unique-local (fc00::/7)
            let unique_local = (s[0] & 0xfe00) == 0xfc00;
            // Link-local (fe80::/10)
            let link_local = (s[0] & 0xffc0) == 0xfe80;
            // IPv4-mapped (::ffff:0:0/96) — check the embedded IPv4 value
            let ipv4_mapped = s[0] == 0
                && s[1] == 0
                && s[2] == 0
                && s[3] == 0
                && s[4] == 0
                && s[5] == 0xffff;
            if unique_local || link_local {
                return true;
            }
            if ipv4_mapped {
                let embedded = std::net::Ipv4Addr::new(
                    (s[6] >> 8) as u8,
                    s[6] as u8,
                    (s[7] >> 8) as u8,
                    s[7] as u8,
                );
                return is_blocked_ip(IpAddr::V4(embedded));
            }
            false
        }
    }
}

/// Download a URL to a temporary file via reqwest (bypasses WebView CSP/CORS).
/// Returns the absolute path of the temp file so the JS side can read it via
/// the fs plugin. The caller is responsible for deleting the temp file.
#[tauri::command]
async fn download_to_temp(url: String) -> Result<String, String> {
    let url = url.trim();
    if !(url.starts_with("https://") || url.starts_with("http://")) {
        return Err("URL must start with https:// or http://".to_string());
    }
    if url.len() > 2048 || url.chars().any(|c| c.is_control()) {
        return Err("URL is not valid.".to_string());
    }

    // Allowlist: this command exists only to fetch HuggingFace model files.
    // Reject any other host so a compromised renderer cannot use it for SSRF.
    let parsed = reqwest::Url::parse(url).map_err(|e| format!("Invalid URL: {}", e))?;
    let host = parsed.host_str().ok_or("URL has no host.")?;
    if !is_allowed_download_host(host) {
        return Err(format!(
            "Downloads from '{}' are not permitted. Only huggingface.co model files are supported.",
            host
        ));
    }

    // Custom redirect policy: only follow redirects to the same allowlisted hosts
    // (HuggingFace CDN redirects are expected; anything else is rejected).
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (compatible; Vindicta/0.1; Kokoro model downloader)")
        .redirect(reqwest::redirect::Policy::custom(|attempt| {
            let redir_host = attempt.url().host_str().unwrap_or("").to_lowercase();
            if ALLOWED_DOWNLOAD_HOSTS.iter().any(|&h| redir_host == h) {
                attempt.follow()
            } else {
                attempt.stop()
            }
        }))
        .timeout(std::time::Duration::from_secs(600))
        .build()
        .map_err(|e| e.to_string())?;

    let resp = client
        .get(url)
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    let status = resp.status();
    if !status.is_success() {
        return Err(format!(
            "HTTP {}: download failed for {}",
            status.as_u16(),
            url
        ));
    }

    let bytes = resp
        .bytes()
        .await
        .map_err(|e| format!("Failed to read response body: {}", e))?;

    // Write to a uniquely named temp file
    let ts = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    let tmp_path = std::env::temp_dir().join(format!("vindicta-dl-{}.bin", ts));

    std::fs::write(&tmp_path, &bytes).map_err(|e| format!("Failed to write temp file: {}", e))?;

    Ok(tmp_path.to_string_lossy().to_string())
}

/// Percent-encode a string for application/x-www-form-urlencoded bodies.
fn form_encode(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for byte in s.as_bytes() {
        match byte {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                out.push(*byte as char)
            }
            b' ' => out.push('+'),
            b => out.push_str(&format!("%{:02X}", b)),
        }
    }
    out
}

/// GitHub Device Flow — step 1: request a device code from GitHub.
/// Returns the user_code to display and the verification_uri to open.
#[derive(serde::Serialize, serde::Deserialize)]
#[serde(rename_all(serialize = "camelCase", deserialize = "snake_case"))]
struct GithubDeviceCodeResponse {
    device_code: String,
    user_code: String,
    verification_uri: String,
    expires_in: u64,
    interval: u64,
}

#[tauri::command]
async fn github_request_device_code(scope: String) -> Result<GithubDeviceCodeResponse, String> {
    if GITHUB_CLIENT_ID.is_empty() {
        return Err(
            "GitHub OAuth is not configured for this build. Set GITHUB_CLIENT_ID before compiling."
                .to_string(),
        );
    }
    let body = format!(
        "client_id={}&scope={}",
        form_encode(GITHUB_CLIENT_ID),
        form_encode(&scope),
    );
    let client = reqwest::Client::builder()
        .user_agent("Vindicta/0.1")
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|e| e.to_string())?;

    let resp = client
        .post("https://github.com/login/device/code")
        .header("Accept", "application/json")
        .header("Content-Type", "application/x-www-form-urlencoded")
        .body(body)
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !resp.status().is_success() {
        return Err(format!("GitHub returned HTTP {}", resp.status().as_u16()));
    }

    resp.json::<GithubDeviceCodeResponse>()
        .await
        .map_err(|e| format!("Failed to parse GitHub response: {}", e))
}

/// GitHub Device Flow — step 2: poll for the access token.
/// Returns the token on success, or an error string containing the GitHub
/// `error` field so callers can distinguish `authorization_pending` from
/// hard failures.
#[derive(serde::Serialize, serde::Deserialize)]
#[serde(rename_all(serialize = "camelCase", deserialize = "snake_case"))]
struct GithubTokenPollResponse {
    access_token: Option<String>,
    token_type: Option<String>,
    scope: Option<String>,
    error: Option<String>,
    error_description: Option<String>,
}

#[tauri::command]
async fn github_poll_access_token(device_code: String) -> Result<GithubTokenPollResponse, String> {
    let grant_type = "urn:ietf:params:oauth:grant-type:device_code";
    let body = format!(
        "client_id={}&device_code={}&grant_type={}",
        form_encode(GITHUB_CLIENT_ID),
        form_encode(&device_code),
        form_encode(grant_type),
    );
    let client = reqwest::Client::builder()
        .user_agent("Vindicta/0.1")
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|e| e.to_string())?;

    let resp = client
        .post("https://github.com/login/oauth/access_token")
        .header("Accept", "application/json")
        .header("Content-Type", "application/x-www-form-urlencoded")
        .body(body)
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !resp.status().is_success() {
        return Err(format!("GitHub returned HTTP {}", resp.status().as_u16()));
    }

    resp.json::<GithubTokenPollResponse>()
        .await
        .map_err(|e| format!("Failed to parse GitHub token response: {}", e))
}

#[tauri::command]
async fn fetch_rss_source(url: String) -> Result<String, String> {
    const MAX_REDIRECTS: usize = 5;
    const MAX_RESPONSE_BYTES: usize = 5 * 1024 * 1024; // 5 MB

    let raw = url.trim().to_owned();
    if !(raw.starts_with("https://") || raw.starts_with("http://")) {
        return Err("RSS source must be an http:// or https:// URL.".to_string());
    }
    if raw.len() > 1000 || raw.chars().any(|c| c.is_control()) {
        return Err("RSS source URL is not valid.".to_string());
    }

    // Redirects are followed manually so every new destination is SSRF-checked
    // before the connection is made.
    let client = reqwest::Client::builder()
        .user_agent("Vindicta/0.1 Security News Reader")
        .redirect(reqwest::redirect::Policy::none())
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|e| e.to_string())?;

    let mut current_url = raw;
    let mut hops: usize = 0;

    loop {
        // Parse and SSRF-check the destination before opening a connection
        let parsed = reqwest::Url::parse(&current_url)
            .map_err(|e| format!("Invalid RSS URL: {}", e))?;
        let host = parsed.host_str().ok_or("RSS URL has no host.")?.to_owned();
        ssrf_check(&host).await?;

        let response = client
            .get(&current_url)
            .send()
            .await
            .map_err(|e| e.to_string())?;

        let status = response.status();

        // Manual redirect following — re-runs the SSRF check for each new target
        if matches!(status.as_u16(), 301 | 302 | 303 | 307 | 308) {
            if hops >= MAX_REDIRECTS {
                return Err("RSS source returned too many redirects.".to_string());
            }
            let location = response
                .headers()
                .get("location")
                .and_then(|v| v.to_str().ok())
                .ok_or_else(|| "Redirect response is missing a Location header.".to_string())?
                .to_owned();
            // Resolve relative Location values against the current URL
            current_url = if location.starts_with("http://") || location.starts_with("https://") {
                location
            } else {
                parsed
                    .join(&location)
                    .map_err(|e| format!("Invalid redirect target: {}", e))?
                    .to_string()
            };
            if current_url.len() > 1000 || current_url.chars().any(|c| c.is_control()) {
                return Err("Redirect URL is not valid.".to_string());
            }
            hops += 1;
            continue;
        }

        if !status.is_success() {
            return Err(format!("RSS source returned HTTP {}", status.as_u16()));
        }

        // Reject responses with content types that are clearly not feeds
        let ct = response
            .headers()
            .get("content-type")
            .and_then(|v| v.to_str().ok())
            .unwrap_or("")
            .to_lowercase();
        if !ct.is_empty()
            && !ct.contains("xml")
            && !ct.contains("rss")
            && !ct.contains("atom")
            && !ct.contains("json")
            && !ct.contains("text")
        {
            return Err(format!(
                "RSS source returned an unexpected content type: '{}'.",
                ct
            ));
        }

        // Enforce a response-body size limit before reading into memory.
        // Content-Length is advisory; the hard cap on `bytes.len()` below is authoritative.
        if let Some(claimed) = response.content_length() {
            if claimed > MAX_RESPONSE_BYTES as u64 {
                return Err(format!(
                    "RSS source is too large ({} bytes; limit is {} bytes).",
                    claimed, MAX_RESPONSE_BYTES
                ));
            }
        }
        let bytes = response.bytes().await.map_err(|e| e.to_string())?;
        if bytes.len() > MAX_RESPONSE_BYTES {
            return Err(format!(
                "RSS source response exceeds the {} MB limit.",
                MAX_RESPONSE_BYTES / (1024 * 1024)
            ));
        }

        return String::from_utf8(bytes.to_vec())
            .map_err(|_| "RSS source returned non-UTF-8 content.".to_string());
    }
}

const PENTEST_USER: &str = "pentest";
const ACADEMY_USER: &str = "academy";

#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

fn hidden_command(program: &str) -> std::process::Command {
    let mut command = std::process::Command::new(program);
    #[cfg(target_os = "windows")]
    {
        command.creation_flags(CREATE_NO_WINDOW);
    }
    command
}

#[tauri::command]
fn auto_start_enabled() -> Result<bool, String> {
    #[cfg(target_os = "windows")]
    {
        let output = hidden_command("reg")
            .args([
                "query",
                r"HKCU\Software\Microsoft\Windows\CurrentVersion\Run",
                "/v",
                "Vindicta",
            ])
            .output()
            .map_err(|error| error.to_string())?;

        Ok(output.status.success())
    }

    #[cfg(not(target_os = "windows"))]
    {
        Ok(false)
    }
}

#[tauri::command]
fn set_auto_start(enabled: bool) -> Result<bool, String> {
    #[cfg(target_os = "windows")]
    {
        if enabled {
            let exe = std::env::current_exe().map_err(|error| error.to_string())?;
            let exe = exe
                .to_str()
                .ok_or_else(|| "Could not resolve Vindicta executable path.".to_string())?;
            let quoted = format!("\"{}\"", exe);
            let status = hidden_command("reg")
                .args([
                    "add",
                    r"HKCU\Software\Microsoft\Windows\CurrentVersion\Run",
                    "/v",
                    "Vindicta",
                    "/t",
                    "REG_SZ",
                    "/d",
                    &quoted,
                    "/f",
                ])
                .status()
                .map_err(|error| error.to_string())?;
            if !status.success() {
                return Err("Windows rejected the startup registry update.".to_string());
            }
        } else {
            let _ = hidden_command("reg")
                .args([
                    "delete",
                    r"HKCU\Software\Microsoft\Windows\CurrentVersion\Run",
                    "/v",
                    "Vindicta",
                    "/f",
                ])
                .status()
                .map_err(|error| error.to_string())?;
        }

        Ok(enabled)
    }

    #[cfg(not(target_os = "windows"))]
    {
        let _ = enabled;
        Err("Auto-start management is only implemented for Windows builds.".to_string())
    }
}

#[tauri::command]
fn wsl_info() -> WslInfo {
    let version_output = hidden_command("wsl").arg("--version").output();
    let version_output = match version_output {
        Ok(output) => output,
        Err(error) => {
            return WslInfo {
                installed: false,
                version: String::new(),
                default_distro: String::new(),
                distributions: vec![],
                error: Some(error.to_string()),
            };
        }
    };

    let version = String::from_utf8_lossy(&version_output.stdout)
        .lines()
        .next()
        .unwrap_or("")
        .trim()
        .to_string();

    let list_output = hidden_command("wsl").args(["--list", "--verbose"]).output();

    let mut distributions = vec![];
    let mut default_distro = String::new();

    if let Ok(output) = list_output {
        let text = String::from_utf8_lossy(&output.stdout).replace('\0', "");
        for line in text.lines().skip(1) {
            let trimmed = line.trim();
            if trimmed.is_empty() {
                continue;
            }
            let default = trimmed.starts_with('*');
            let clean = trimmed.trim_start_matches('*').trim();
            let parts: Vec<&str> = clean.split_whitespace().collect();
            if parts.is_empty() {
                continue;
            }
            let name = parts[0].to_string();
            if default {
                default_distro = name.clone();
            }
            distributions.push(WslDistro {
                name,
                state: parts.get(1).unwrap_or(&"").to_string(),
                version: parts.get(2).unwrap_or(&"").to_string(),
                default,
            });
        }
    }

    WslInfo {
        installed: version_output.status.success(),
        version,
        default_distro,
        distributions,
        error: if version_output.status.success() {
            None
        } else {
            Some(
                String::from_utf8_lossy(&version_output.stderr)
                    .trim()
                    .to_string(),
            )
        },
    }
}

#[tauri::command]
fn wsl_unregister_distribution(name: String) -> Result<(), String> {
    if name.trim().is_empty() {
        return Err("Choose a WSL distribution to purge.".to_string());
    }

    let status = hidden_command("wsl")
        .args(["--unregister", name.trim()])
        .status()
        .map_err(|error| error.to_string())?;

    if status.success() {
        Ok(())
    } else {
        Err(format!("Could not unregister WSL distribution '{}'.", name))
    }
}

#[tauri::command]
async fn wsl_start_distribution(name: String) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || wsl_start_distribution_blocking(&name))
        .await
        .map_err(|error| error.to_string())?
}

fn wsl_start_distribution_blocking(name: &str) -> Result<(), String> {
    let script = "nohup sh -c 'while true; do sleep 3600; done' >/dev/null 2>&1 &";
    run_wsl_shell(name, Some("root"), script).map(|_| ())
}

#[tauri::command]
async fn wsl_ensure_pentest_backend(distro: String) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || wsl_ensure_pentest_backend_blocking(&distro))
        .await
        .map_err(|error| error.to_string())?
}

fn wsl_ensure_pentest_backend_blocking(distro: &str) -> Result<String, String> {
    wsl_start_distribution_blocking(distro)?;
    let script = format!(
        r#"set -eu
if ! id -u {user} >/dev/null 2>&1; then
  useradd -m -s /bin/bash {user}
fi
install -d -o {user} -g {user} /home/{user}/vindicta /home/{user}/vindicta/tools /home/{user}/vindicta/workspace /home/{user}/.local/bin
touch /home/{user}/vindicta/.managed-by-vindicta
chown -R {user}:{user} /home/{user}/vindicta /home/{user}/.local
printf 'Pentest backend ready: /home/{user}/vindicta\n'
"#,
        user = PENTEST_USER
    );
    run_wsl_shell(distro, Some("root"), &script)
}

#[tauri::command]
async fn wsl_pentest_tool_status(
    distro: String,
    tool_ids: Vec<String>,
) -> Result<Vec<PentestToolStatus>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        wsl_pentest_tool_status_blocking(&distro, tool_ids)
    })
    .await
    .map_err(|error| error.to_string())?
}

fn wsl_pentest_tool_status_blocking(
    distro: &str,
    tool_ids: Vec<String>,
) -> Result<Vec<PentestToolStatus>, String> {
    let mut statuses = Vec::new();
    for tool_id in tool_ids {
        let Some((command, _package)) = pentest_tool_mapping(&tool_id) else {
            continue;
        };
        let script = format!("command -v {} >/dev/null 2>&1", shell_quote(command));
        let installed = run_wsl_shell(&distro, Some(PENTEST_USER), &script).is_ok();
        statuses.push(PentestToolStatus {
            tool_id,
            installed,
            command: command.to_string(),
        });
    }
    Ok(statuses)
}

#[tauri::command]
async fn wsl_install_pentest_tool(distro: String, tool_id: String) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || {
        wsl_install_pentest_tool_blocking(&distro, &tool_id)
    })
    .await
    .map_err(|error| error.to_string())?
}

fn wsl_install_pentest_tool_blocking(distro: &str, tool_id: &str) -> Result<String, String> {
    wsl_ensure_pentest_backend_blocking(distro)?;
    let Some((_command, package)) = pentest_tool_mapping(&tool_id) else {
        return Err(format!(
            "{} is not available through the WSL package installer yet.",
            tool_id
        ));
    };
    if package.is_empty() {
        return Err(format!(
            "{} requires a vendor installer and cannot be installed automatically yet.",
            tool_id
        ));
    }

    let script = format!(
        r#"set -eu
if ! command -v apt-get >/dev/null 2>&1; then
  printf 'This WSL distribution does not expose apt-get. Install %s manually for the pentest account.\n' {package}
  exit 12
fi
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y {package}
install -d -o {user} -g {user} /home/{user}/vindicta/tools
printf '%s installed for the Vindicta pentest backend.\n' {package}
"#,
        package = shell_quote(package),
        user = PENTEST_USER
    );
    run_wsl_shell(distro, Some("root"), &script)
}

#[tauri::command]
async fn wsl_run_pentest_action(
    distro: String,
    action: String,
    target: String,
) -> Result<PentestRunResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        wsl_run_pentest_action_blocking(&distro, &action, &target)
    })
    .await
    .map_err(|error| error.to_string())?
}

fn wsl_run_pentest_action_blocking(
    distro: &str,
    action: &str,
    target: &str,
) -> Result<PentestRunResult, String> {
    wsl_ensure_pentest_backend_blocking(distro)?;
    let (label, command, script) = pentest_action_script(action, target)?;
    let output = run_wsl_shell(distro, Some(PENTEST_USER), &script)?;
    Ok(PentestRunResult {
        action: label,
        command,
        output,
    })
}

/// Set up the dedicated academy WSL account and workspace directory.
#[tauri::command]
async fn wsl_ensure_academy_backend(distro: String) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || wsl_ensure_academy_backend_blocking(&distro))
        .await
        .map_err(|error| error.to_string())?
}

fn wsl_ensure_academy_backend_blocking(distro: &str) -> Result<String, String> {
    wsl_start_distribution_blocking(distro)?;
    let script = format!(
        r#"set -eu
if ! id -u {user} >/dev/null 2>&1; then
  useradd -m -s /bin/bash {user}
fi
install -d -o {user} -g {user} /home/{user}/vindicta /home/{user}/vindicta/workspace /home/{user}/.local/bin
touch /home/{user}/vindicta/.managed-by-vindicta
chown -R {user}:{user} /home/{user}/vindicta /home/{user}/.local
printf 'Academy backend ready: /home/{user}/vindicta\n'
"#,
        user = ACADEMY_USER
    );
    run_wsl_shell(distro, Some("root"), &script)
}

/// Run a shell command as the academy user (30 s timeout, max 200 lines of output).
#[tauri::command]
async fn wsl_run_academy_command(distro: String, command: String) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || {
        wsl_run_academy_command_blocking(&distro, &command)
    })
    .await
    .map_err(|error| error.to_string())?
}

fn wsl_run_academy_command_blocking(distro: &str, command: &str) -> Result<String, String> {
    validate_academy_command(command)?;
    run_wsl_shell(distro, Some(ACADEMY_USER), &academy_command_script(command))
}

#[tauri::command]
async fn wsl_run_academy_command_stream(
    app: tauri::AppHandle,
    distro: String,
    command: String,
    run_id: String,
) -> Result<(), String> {
    validate_academy_command(&command)?;
    if run_id.trim().is_empty() {
        return Err("Missing terminal run id.".to_string());
    }

    std::thread::spawn(move || {
        let result = stream_wsl_shell(
            app.clone(),
            run_id.clone(),
            &distro,
            Some(ACADEMY_USER),
            &academy_command_script(&command),
        );
        if let Err(error) = result {
            let _ = app.emit(
                "academy-terminal-chunk",
                AcademyTerminalEvent {
                    run_id,
                    stream: "stderr".to_string(),
                    text: format!("{}\n", error),
                    done: true,
                    code: Some(1),
                },
            );
        }
    });

    Ok(())
}

fn validate_academy_command(command: &str) -> Result<(), String> {
    let lower = command.to_lowercase();
    const BLOCKED: &[&str] = &[
        "rm -rf /",
        "mkfs",
        "dd if=",
        ":(){ :|:& };:",
        "chmod 000 /",
        "chown root /",
        "shutdown",
        "reboot",
        "halt",
        "poweroff",
        "init 0",
        "init 6",
    ];
    for b in BLOCKED {
        if lower.contains(b) {
            return Err(format!("Command blocked for safety: matches '{}'", b));
        }
    }
    if command.len() > 2000 {
        return Err("Command is too long.".to_string());
    }
    Ok(())
}

fn academy_command_script(command: &str) -> String {
    let safe_cmd = command.replace('\'', r#"'\''"#);
    format!(
        "set -u\ncd ~/vindicta/workspace 2>/dev/null || cd ~\ntimeout 30s sh -c 'export SUDO_ASKPASS=/bin/false\nsudo() {{ command sudo -n \"$@\"; }}\n{}' </dev/null 2>&1 | awk 'NR<=300 {{ print; fflush() }} NR==301 {{ print \"[vindicta] output truncated after 300 lines.\"; fflush(); exit }}'",
        safe_cmd
    )
}

/// Remove only the Vindicta-managed user accounts (pentest, academy) and their
/// home directories from a distribution — does NOT unregister the whole distro.
#[tauri::command]
async fn wsl_purge_vindicta_profiles(distro: String) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || wsl_purge_vindicta_profiles_blocking(&distro))
        .await
        .map_err(|error| error.to_string())?
}

fn wsl_purge_vindicta_profiles_blocking(distro: &str) -> Result<String, String> {
    if distro.trim().is_empty() {
        return Err("Select a WSL distribution first.".to_string());
    }
    // Vindicta manages two accounts inside WSL: 'pentest' and 'academy'
    const VINDICTA_USERS: &[&str] = &["pentest", "academy"];
    let users_list = VINDICTA_USERS.join(" ");
    let script = format!(
        r#"set -eu
REMOVED=""
for USER in {users}; do
  if id -u "$USER" >/dev/null 2>&1; then
    userdel -r "$USER" 2>&1 || true
    rm -rf "/home/$USER" 2>/dev/null || true
    REMOVED="$REMOVED $USER"
    printf 'Removed Vindicta account: %s\n' "$USER"
  else
    printf 'Account not found (skipped): %s\n' "$USER"
  fi
done
rm -rf /home/.vindicta-managed 2>/dev/null || true
if [ -z "$REMOVED" ]; then
  printf 'No Vindicta-managed accounts were found in this distribution.\n'
else
  printf 'Vindicta profiles purged:%s\n' "$REMOVED"
fi
"#,
        users = users_list
    );
    run_wsl_shell(distro, Some("root"), &script)
}

fn run_wsl_shell(distro: &str, user: Option<&str>, script: &str) -> Result<String, String> {
    let distro = distro.trim();
    let mut command = hidden_command("wsl");
    if !distro.is_empty() {
        command.args(["-d", distro]);
    }
    if let Some(user) = user {
        command.args(["-u", user]);
    }
    let output = command
        .args(["--exec", "sh", "-lc", script])
        .stdin(std::process::Stdio::null())
        .output()
        .map_err(|error| error.to_string())?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
        Err(if stderr.is_empty() { stdout } else { stderr })
    }
}

fn stream_wsl_shell(
    app: tauri::AppHandle,
    run_id: String,
    distro: &str,
    user: Option<&str>,
    script: &str,
) -> Result<(), String> {
    let distro = distro.trim();
    let mut command = hidden_command("wsl");
    if !distro.is_empty() {
        command.args(["-d", distro]);
    }
    if let Some(user) = user {
        command.args(["-u", user]);
    }

    let mut child = command
        .args(["--exec", "sh", "-lc", script])
        .stdin(std::process::Stdio::null())
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .map_err(|error| error.to_string())?;

    let stdout = child.stdout.take();
    let stderr = child.stderr.take();

    let mut readers = Vec::new();
    if let Some(stdout) = stdout {
        readers.push(spawn_terminal_reader(
            app.clone(),
            run_id.clone(),
            "stdout",
            stdout,
        ));
    }
    if let Some(stderr) = stderr {
        readers.push(spawn_terminal_reader(
            app.clone(),
            run_id.clone(),
            "stderr",
            stderr,
        ));
    }

    let status = child.wait().map_err(|error| error.to_string())?;
    for reader in readers {
        let _ = reader.join();
    }

    let _ = app.emit(
        "academy-terminal-chunk",
        AcademyTerminalEvent {
            run_id,
            stream: "system".to_string(),
            text: String::new(),
            done: true,
            code: status.code(),
        },
    );
    Ok(())
}

fn spawn_terminal_reader<R>(
    app: tauri::AppHandle,
    run_id: String,
    stream: &'static str,
    mut reader: R,
) -> std::thread::JoinHandle<()>
where
    R: Read + Send + 'static,
{
    std::thread::spawn(move || {
        let mut buffer = [0_u8; 1024];
        loop {
            match reader.read(&mut buffer) {
                Ok(0) => break,
                Ok(n) => {
                    let text = String::from_utf8_lossy(&buffer[..n]).to_string();
                    let _ = app.emit(
                        "academy-terminal-chunk",
                        AcademyTerminalEvent {
                            run_id: run_id.clone(),
                            stream: stream.to_string(),
                            text,
                            done: false,
                            code: None,
                        },
                    );
                }
                Err(error) => {
                    let _ = app.emit(
                        "academy-terminal-chunk",
                        AcademyTerminalEvent {
                            run_id: run_id.clone(),
                            stream: "stderr".to_string(),
                            text: format!("{}\n", error),
                            done: false,
                            code: None,
                        },
                    );
                    break;
                }
            }
        }
    })
}

fn pentest_tool_mapping(tool_id: &str) -> Option<(&'static str, &'static str)> {
    match tool_id {
        "nmap" => Some(("nmap", "nmap")),
        "mitmproxy" => Some(("mitmproxy", "mitmproxy")),
        "sqlmap" => Some(("sqlmap", "sqlmap")),
        "gobuster" => Some(("gobuster", "gobuster")),
        "metasploit" => Some(("msfconsole", "metasploit-framework")),
        "hydra" => Some(("hydra", "hydra")),
        "aircrack" => Some(("aircrack-ng", "aircrack-ng")),
        "snort" => Some(("snort", "snort")),
        "suricata" => Some(("suricata", "suricata")),
        "openvas" => Some(("gvm-check-setup", "gvm")),
        "logwatch" => Some(("logwatch", "logwatch")),
        "fail2ban" => Some(("fail2ban-client", "fail2ban")),
        "nessus" => Some(("nessuscli", "")),
        _ => None,
    }
}

fn pentest_action_script(action: &str, target: &str) -> Result<(String, String, String), String> {
    match action {
        "recon_quick" => {
            let host = normalize_host_target(target)?;
            let command = format!(
                "nmap -T3 -F -Pn --max-retries 2 --host-timeout 45s --reason {}",
                host
            );
            Ok((
                "Quick Recon".to_string(),
                command.clone(),
                format!(
                    "set -u\ncommand -v nmap >/dev/null 2>&1 || {{ echo 'nmap is not installed in the pentest account.'; exit 127; }}\ncd ~/vindicta/workspace\nif ! timeout 70s {} 2>&1; then code=$?; echo \"[vindicta] command finished with exit code $code\"; fi",
                    command
                ),
            ))
        }
        "service_scan" => {
            let host = normalize_host_target(target)?;
            let command = format!(
                "nmap -sV --version-light -T3 -Pn --max-retries 2 --host-timeout 60s --top-ports 80 {}",
                host
            );
            Ok((
                "Service Scan".to_string(),
                command.clone(),
                format!(
                    "set -u\ncommand -v nmap >/dev/null 2>&1 || {{ echo 'nmap is not installed in the pentest account.'; exit 127; }}\ncd ~/vindicta/workspace\nif ! timeout 90s {} 2>&1; then code=$?; echo \"[vindicta] command finished with exit code $code\"; fi",
                    command
                ),
            ))
        }
        "web_headers" => {
            let url = normalize_url_target(target)?;
            let command = format!("curl -k -I --max-time 20 {}", shell_quote(&url));
            Ok((
                "HTTP Headers".to_string(),
                command.clone(),
                format!(
                    "set -u\ncommand -v curl >/dev/null 2>&1 || {{ echo 'curl is not installed in the pentest account.'; exit 127; }}\ncd ~/vindicta/workspace\nif ! {} 2>&1; then code=$?; echo \"[vindicta] command finished with exit code $code\"; fi",
                    command
                ),
            ))
        }
        "web_directories" => {
            let url = normalize_url_target(target)?;
            let quoted_url = shell_quote(&url);
            let command = format!("gobuster dir -q -t 12 -u {} -w <wordlist>", quoted_url);
            Ok((
                "Directory Enumeration".to_string(),
                command.clone(),
                format!(
                    r#"set -u
command -v gobuster >/dev/null 2>&1 || {{ echo 'gobuster is not installed in the pentest account.'; exit 127; }}
cd ~/vindicta/workspace
WORDLIST="/usr/share/wordlists/dirb/common.txt"
if [ ! -f "$WORDLIST" ]; then
  WORDLIST="/tmp/vindicta-common.txt"
  printf "admin\napi\nassets\nbackup\nconfig\ndashboard\ndebug\ndocs\nlogin\nportal\nserver-status\nuploads\n" > "$WORDLIST"
fi
if ! timeout 80s gobuster dir -q -t 8 -u {url} -w "$WORDLIST" --timeout 12s 2>&1; then
  code=$?
  echo "[vindicta] command finished with exit code $code"
fi
"#,
                    url = quoted_url
                ),
            ))
        }
        "sqlmap_check" => {
            let url = normalize_url_target(target)?;
            let command = format!(
                "sqlmap -u {} --batch --smart --level=1 --risk=1",
                shell_quote(&url)
            );
            Ok((
                "SQL Injection Check".to_string(),
                command.clone(),
                format!(
                    "set -u\ncommand -v sqlmap >/dev/null 2>&1 || {{ echo 'sqlmap is not installed in the pentest account.'; exit 127; }}\ncd ~/vindicta/workspace\nif ! timeout 120s {} 2>&1; then code=$?; echo \"[vindicta] command finished with exit code $code\"; fi",
                    command
                ),
            ))
        }
        "local_posture" => {
            let command =
                "hostname; whoami; uname -a; ss -tulpen 2>/dev/null | head -80".to_string();
            Ok((
                "Local Posture".to_string(),
                command.clone(),
                format!("set -eu\ncd ~/vindicta/workspace\n{}", command),
            ))
        }
        "dns_recon" => {
            let host = normalize_host_target(target)?;
            // Unquote for display since shell_quote wraps in single-quotes
            let host_display = host.trim_matches('\'').to_string();
            let command = format!(
                "dig +noall +answer ANY {h}; host {h} 2>&1; dig +short MX {h}; dig +short TXT {h}",
                h = host_display
            );
            Ok((
                "DNS Reconnaissance".to_string(),
                command.clone(),
                format!(
                    r#"set -u
cd ~/vindicta/workspace
HOST={host}
echo "=== A / AAAA records ==="
dig +noall +answer A "$HOST" || true
dig +noall +answer AAAA "$HOST" || true
echo "=== MX records ==="
dig +short MX "$HOST" || true
echo "=== TXT / SPF ==="
dig +short TXT "$HOST" || true
echo "=== NS records ==="
dig +short NS "$HOST" || true
echo "=== Zone transfer attempt (axfr) ==="
dig AXFR "$HOST" 2>&1 | head -30 || true
echo "=== Reverse lookup ==="
host "$HOST" 2>&1 || true
"#,
                    host = host
                ),
            ))
        }
        "ssl_check" => {
            let host_raw = normalize_host_target(target)?;
            let host = host_raw.trim_matches('\'').to_string();
            let command = format!(
                "openssl s_client -connect {}:443 -showcerts </dev/null 2>&1",
                host
            );
            Ok((
                "SSL/TLS Certificate Check".to_string(),
                command.clone(),
                format!(
                    r#"set -u
HOST={host}
PORT=443
echo "=== Certificate chain ==="
echo | timeout 15s openssl s_client -connect "$HOST:$PORT" -showcerts 2>&1 | head -80 || echo "(openssl not available or connection timed out)"
echo ""
echo "=== Certificate expiry & subject ==="
echo | timeout 15s openssl s_client -connect "$HOST:$PORT" 2>/dev/null | openssl x509 -noout -subject -issuer -dates -fingerprint 2>&1 || echo "(could not parse certificate)"
echo ""
echo "=== Supported protocol check (TLS 1.0 — try to connect) ==="
timeout 8s openssl s_client -connect "$HOST:$PORT" -tls1 </dev/null 2>&1 | grep -E "Protocol|Cipher|CONNECTED|FAILED" || echo "TLS 1.0: no response"
timeout 8s openssl s_client -connect "$HOST:$PORT" -tls1_2 </dev/null 2>&1 | grep -E "Protocol|Cipher|CONNECTED|FAILED" || echo "TLS 1.2: no response"
timeout 8s openssl s_client -connect "$HOST:$PORT" -tls1_3 </dev/null 2>&1 | grep -E "Protocol|Cipher|CONNECTED|FAILED" || echo "TLS 1.3: no response"
"#,
                    host = host_raw
                ),
            ))
        }
        _ => Err("Choose a supported pentest action.".to_string()),
    }
}

fn normalize_host_target(target: &str) -> Result<String, String> {
    let value = target.trim();
    if value.is_empty() {
        return Err("Enter an authorized target first.".to_string());
    }
    let without_scheme = value
        .strip_prefix("http://")
        .or_else(|| value.strip_prefix("https://"))
        .unwrap_or(value);
    let host = without_scheme
        .split('/')
        .next()
        .unwrap_or("")
        .trim()
        .trim_end_matches('.');
    validate_target_token(host)?;
    Ok(shell_quote(host))
}

fn normalize_url_target(target: &str) -> Result<String, String> {
    let value = target.trim();
    let value = if value.starts_with("http://") || value.starts_with("https://") {
        value.to_string()
    } else {
        let host = value.split('/').next().unwrap_or("").trim();
        validate_target_token(host)?;
        format!("https://{}", value)
    };
    if value.len() > 500 || value.chars().any(|c| c.is_control()) {
        return Err("Target URL is not valid.".to_string());
    }
    if value.chars().any(|c| "`$<>|;&\\".contains(c)) {
        return Err("Target URL contains unsupported shell characters.".to_string());
    }
    Ok(value.to_string())
}

fn validate_target_token(value: &str) -> Result<(), String> {
    if value.is_empty() || value.len() > 255 {
        return Err("Target host is not valid.".to_string());
    }
    if value
        .chars()
        .any(|c| c.is_whitespace() || c.is_control() || "`$<>|;&\\".contains(c))
    {
        return Err("Target host contains unsupported characters.".to_string());
    }
    Ok(())
}

fn shell_quote(value: &str) -> String {
    format!("'{}'", value.replace('\'', r#"'\''"#))
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            auto_start_enabled,
            set_auto_start,
            wsl_info,
            wsl_unregister_distribution,
            wsl_purge_vindicta_profiles,
            wsl_ensure_academy_backend,
            wsl_run_academy_command,
            wsl_run_academy_command_stream,
            wsl_start_distribution,
            wsl_ensure_pentest_backend,
            wsl_pentest_tool_status,
            wsl_install_pentest_tool,
            wsl_run_pentest_action,
            fetch_rss_source,
            download_to_temp,
            github_request_device_code,
            github_poll_access_token,
        ])
        .setup(|app| {
            // Build system tray icon — shows the main window on left-click
            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("Vindicta — click to open")
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running vindicta");
}
