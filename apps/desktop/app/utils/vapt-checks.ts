export interface VaptCheck {
  id: string
  label: string
  desc: string
  promptInstruction: string
}

export interface VaptCategory {
  category: string
  checks: VaptCheck[]
}

export const VAPT_CHECK_CATALOG: Record<string, VaptCategory[]> = {
  web_application: [
    {
      category: 'Injection',
      checks: [
        { id: 'sqli', label: 'SQL Injection', desc: 'User input in SQL queries', promptInstruction: 'Check for SQL injection: unsanitized parameters, string concatenation in queries, raw SQL with user input, ORM raw() calls.' },
        { id: 'nosqli', label: 'NoSQL Injection', desc: 'MongoDB/Firebase query abuse', promptInstruction: 'Check for NoSQL injection: $where/$regex with user input in MongoDB, Firebase/DynamoDB query manipulation.' },
        { id: 'xss_reflected', label: 'Reflected XSS', desc: 'Input reflected in HTML response', promptInstruction: 'Check for reflected XSS: user input rendered in HTML without encoding, unsafe innerHTML, dangerouslySetInnerHTML, v-html with user data.' },
        { id: 'xss_stored', label: 'Stored XSS', desc: 'Persisted malicious scripts', promptInstruction: 'Check for stored XSS: user data saved to database then rendered without encoding in HTML output.' },
        { id: 'cmdi', label: 'Command Injection', desc: 'Shell commands with user input', promptInstruction: 'Check for command injection in exec(), spawn(), child_process calls with user-controlled arguments or unsanitized shell strings.' },
        { id: 'ssti', label: 'Template Injection (SSTI)', desc: 'User input in template engines', promptInstruction: 'Check for SSTI: user-controlled data passed to template engines (Handlebars, Jinja, Twig, EJS, Nunjucks) without escaping.' },
        { id: 'xxe', label: 'XXE / XML Injection', desc: 'XML entity expansion', promptInstruction: 'Check for XXE: XML parsers with external entity processing enabled, user-controlled XML input, DOCTYPE declarations not blocked.' },
        { id: 'ldap_inj', label: 'LDAP Injection', desc: 'Unsanitized LDAP queries', promptInstruction: 'Check for LDAP injection: user input in LDAP search filters without proper escaping of special characters.' },
      ],
    },
    {
      category: 'Authentication & Session',
      checks: [
        { id: 'auth_weak', label: 'Weak Authentication', desc: 'No lockout, weak passwords', promptInstruction: 'Check for missing brute force protection, weak password policies, no account lockout, no rate limiting on auth endpoints, missing MFA.' },
        { id: 'session_mgmt', label: 'Session Fixation / Hijacking', desc: 'Insecure session tokens', promptInstruction: 'Check for session fixation, missing HttpOnly/Secure cookie flags, predictable session IDs, session not regenerated after login/privilege change.' },
        { id: 'csrf', label: 'CSRF', desc: 'Missing anti-CSRF tokens', promptInstruction: 'Check for CSRF: missing anti-CSRF tokens on state-changing POST/PUT/DELETE/PATCH endpoints, missing SameSite cookie attribute, unsafe CORS.' },
        { id: 'jwt', label: 'JWT Vulnerabilities', desc: 'Algorithm confusion, weak secrets', promptInstruction: 'Check JWT: algorithm confusion (none/RS→HS), weak or hardcoded secrets, missing exp validation, missing iss/aud checks, tokens in localStorage.' },
        { id: 'oauth', label: 'OAuth / SSO Misconfig', desc: 'Open redirect, state forgery', promptInstruction: 'Check OAuth flows: missing state parameter, open redirect in redirect_uri, authorization code reuse, implicit flow token exposure.' },
      ],
    },
    {
      category: 'Access Control',
      checks: [
        { id: 'idor', label: 'IDOR', desc: 'Direct object reference bypass', promptInstruction: 'Check for IDOR: endpoints accessing resources by ID without verifying the requesting user owns or is authorized for that specific resource.' },
        { id: 'priv_esc', label: 'Privilege Escalation', desc: 'Vertical access control bypass', promptInstruction: 'Check for privilege escalation: endpoints accessible by lower-privileged users, missing role checks, parameter-based role override, admin panels accessible to regular users.' },
        { id: 'mass_assign', label: 'Mass Assignment', desc: 'Unfiltered request body binding', promptInstruction: 'Check for mass assignment: request body bound directly to models without allowlist, allowing users to set hidden fields like isAdmin, role, balance, price.' },
        { id: 'path_traversal', label: 'Path Traversal', desc: '../ in file paths', promptInstruction: 'Check for path traversal: user-controlled file paths with ../, missing path canonicalization, directory listing, files served outside allowed directories.' },
      ],
    },
    {
      category: 'Security Misconfiguration',
      checks: [
        { id: 'cors', label: 'CORS Misconfiguration', desc: 'Permissive cross-origin policy', promptInstruction: 'Check CORS: wildcard origin with credentials, reflected Origin header without validation, missing Vary header, overly permissive allowed-origins list.' },
        { id: 'sec_headers', label: 'Missing Security Headers', desc: 'No CSP, HSTS, X-Frame-Options', promptInstruction: 'Check for missing headers: Content-Security-Policy, Strict-Transport-Security, X-Frame-Options, X-Content-Type-Options, Permissions-Policy, Referrer-Policy.' },
        { id: 'error_disclosure', label: 'Verbose Error Messages', desc: 'Stack traces in responses', promptInstruction: 'Check for verbose error handling: stack traces, database errors, internal paths, or sensitive config disclosed in error responses or debug pages.' },
        { id: 'debug_mode', label: 'Debug Mode / Dev Artifacts', desc: 'Dev features in production', promptInstruction: 'Check for debug flags, test routes, development-only endpoints, console.log with sensitive data, or test accounts left in production.' },
        { id: 'clickjacking', label: 'Clickjacking', desc: 'Missing frame protection', promptInstruction: 'Check for clickjacking: missing X-Frame-Options or frame-ancestors CSP directive on sensitive pages (login, payment, settings).' },
      ],
    },
    {
      category: 'Sensitive Data & Cryptography',
      checks: [
        { id: 'secrets', label: 'Hardcoded Secrets', desc: 'API keys, passwords in code', promptInstruction: 'Check for hardcoded credentials: API keys, database passwords, JWT secrets, private keys committed to source or in config files.' },
        { id: 'sensitive_storage', label: 'Insecure Data Storage', desc: 'PII in logs, localStorage', promptInstruction: 'Check for PII, tokens, or credentials stored in localStorage/sessionStorage, logged in plaintext, or written to insecure client-side storage.' },
        { id: 'crypto_weak', label: 'Weak Cryptography', desc: 'MD5, SHA1, ECB mode', promptInstruction: 'Check for weak algorithms: MD5/SHA1 for passwords (not bcrypt/argon2), ECB cipher mode, static IVs, insufficient key length, predictable salts.' },
        { id: 'https', label: 'Insecure Transport', desc: 'HTTP allowed, weak TLS', promptInstruction: 'Check for HTTP endpoints, missing HSTS, TLS 1.0/1.1 support, weak cipher suites, certificate validation bypass.' },
      ],
    },
    {
      category: 'File Handling & SSRF',
      checks: [
        { id: 'file_upload', label: 'Unrestricted File Upload', desc: 'Executable files allowed', promptInstruction: 'Check for unrestricted file upload: missing MIME type validation, filename sanitization, upload to web-accessible path, missing content-type enforcement.' },
        { id: 'ssrf', label: 'SSRF', desc: 'Server fetches user-controlled URLs', promptInstruction: 'Check for SSRF: user-controlled URLs fetched server-side, missing URL allowlist, access to cloud metadata (169.254.169.254), internal service exposure.' },
        { id: 'open_redirect', label: 'Open Redirect', desc: 'Unvalidated redirect URLs', promptInstruction: 'Check for open redirect: user-controlled redirect/next/return URL parameters not validated against an allowlist of safe destinations.' },
      ],
    },
  ],
  api: [
    {
      category: 'Broken Object Authorization',
      checks: [
        { id: 'bola', label: 'BOLA / IDOR', desc: 'Resource access without ownership check', promptInstruction: 'Check BOLA: every endpoint accepting a resource ID must verify the authenticated user owns or is authorized for that resource. Look for missing user/owner checks in handlers.' },
        { id: 'bfla', label: 'Broken Function Level Auth', desc: 'Admin endpoints accessible to users', promptInstruction: 'Check BFLA: admin or privileged functions accessible by regular users, missing role-based guards on DELETE/admin/privileged operations.' },
        { id: 'bopla', label: 'Broken Object Property Auth', desc: 'Write to restricted fields', promptInstruction: 'Check BOPLA: request bodies allowing writes to restricted properties (role, isAdmin, price), responses containing fields the user should not see.' },
      ],
    },
    {
      category: 'Authentication',
      checks: [
        { id: 'api_auth', label: 'Broken Authentication', desc: 'Token validation gaps', promptInstruction: 'Check API auth: JWT validation, API key strength and rotation, missing auth guards on sensitive endpoints, bearer token exposure in logs or GET params.' },
        { id: 'rate_limit', label: 'Missing Rate Limiting', desc: 'Unlimited requests allowed', promptInstruction: 'Check for rate limiting on: auth endpoints, login, password reset, OTP, and computationally expensive operations. Missing throttling enables brute force and DoS.' },
        { id: 'replay', label: 'Replay Attack Vulnerability', desc: 'Reusable request signatures', promptInstruction: 'Check request signing: nonce/timestamp usage, replay window enforcement, HMAC signatures on sensitive operations.' },
      ],
    },
    {
      category: 'Injection & Input',
      checks: [
        { id: 'api_sqli', label: 'SQL / NoSQL Injection', desc: 'Query injection via API params', promptInstruction: 'Check API params for injection: path params, query strings, request body fields used in SQL or NoSQL queries without parameterization.' },
        { id: 'mass_assign', label: 'Mass Assignment', desc: 'Unfiltered request body binding', promptInstruction: 'Check for mass assignment: request body fields mapped to data models without allowlist filtering, enabling writes to privileged fields.' },
        { id: 'schema_valid', label: 'Missing Input Validation', desc: 'No schema enforcement', promptInstruction: 'Check input validation: missing JSON schema enforcement, type coercion issues, negative values in quantity/price, missing length/format constraints on all inputs.' },
        { id: 'api_cmdi', label: 'Command Injection', desc: 'User input in system calls', promptInstruction: 'Check for command injection via API: file operations, report generation, image processing passing API input to shell commands.' },
      ],
    },
    {
      category: 'Security Misconfiguration',
      checks: [
        { id: 'cors', label: 'CORS Misconfiguration', desc: 'Reflected Origin, wildcard', promptInstruction: 'Check CORS: reflected Origin header, allowlist enforcement, credentials with wildcard origin, pre-flight handling.' },
        { id: 'excess_data', label: 'Excessive Data Exposure', desc: 'Over-fetching in responses', promptInstruction: 'Check for over-fetching: API responses returning more fields than needed, internal IDs, audit fields, PII, or other users data in list endpoints.' },
        { id: 'api_versioning', label: 'Deprecated API Versions', desc: 'Old endpoints with weaker security', promptInstruction: 'Check for deprecated/unversioned API endpoints (/v1, /legacy) lacking security controls present in current versions.' },
        { id: 'verbose_errors', label: 'Verbose API Errors', desc: 'Stack traces in error responses', promptInstruction: 'Check for stack traces, SQL errors, or internal implementation details exposed in API error responses.' },
      ],
    },
    {
      category: 'Business Logic',
      checks: [
        { id: 'race_cond', label: 'Race Conditions', desc: 'TOCTOU in critical operations', promptInstruction: 'Check for race conditions in payment processing, inventory deduction, balance transfers, ticket issuance — operations requiring atomic database operations.' },
        { id: 'pagination', label: 'Unsafe Pagination', desc: 'Unbounded list responses', promptInstruction: 'Check pagination: missing limit enforcement, cursor-based traversal exposing other users data, offset injection, sort field injection.' },
        { id: 'ssrf', label: 'SSRF via API', desc: 'API fetches user-supplied URLs', promptInstruction: 'Check for SSRF: webhooks, URL fetching endpoints, import/export features processing user-supplied URLs without allowlist validation.' },
      ],
    },
    {
      category: 'Sensitive Data',
      checks: [
        { id: 'secrets', label: 'Secret Exposure in Responses', desc: 'Tokens in API responses', promptInstruction: 'Check for secrets in API responses, access tokens/API keys returned in responses or logged, sensitive fields in error messages.' },
        { id: 'api_transport', label: 'Insecure Transport', desc: 'HTTP endpoints, weak TLS', promptInstruction: 'Check for HTTP (non-HTTPS) API endpoints, missing HSTS, outdated TLS versions, certificate validation bypass in API clients.' },
      ],
    },
  ],
  mobile_application: [
    {
      category: 'Data Storage',
      checks: [
        { id: 'insecure_storage', label: 'Insecure Local Storage', desc: 'SharedPrefs, plist plaintext', promptInstruction: 'Check for sensitive data in SharedPreferences (Android), UserDefaults/plist (iOS), SQLite, or external storage without encryption.' },
        { id: 'keychain', label: 'Keychain / Keystore Misuse', desc: 'Sensitive data outside secure storage', promptInstruction: 'Check that sensitive data (tokens, keys, passwords) uses Android Keystore / iOS Keychain, not SharedPreferences or UserDefaults.' },
        { id: 'log_sensitive', label: 'Sensitive Data in Logs', desc: 'PII or tokens in logcat/NSLog', promptInstruction: 'Check for PII, tokens, or passwords in Logcat (Android) or os.log/NSLog (iOS) in debug or release builds.' },
        { id: 'clipboard', label: 'Clipboard Data Exposure', desc: 'PII auto-copied to clipboard', promptInstruction: 'Check for sensitive data (passwords, card numbers, OTPs) auto-placed in clipboard, missing clipboard clearing after sensitive operations.' },
      ],
    },
    {
      category: 'Network Security',
      checks: [
        { id: 'cleartext', label: 'Cleartext Traffic', desc: 'HTTP instead of HTTPS', promptInstruction: 'Check for cleartext HTTP: missing Network Security Config (Android), ATS exceptions (iOS), hardcoded HTTP URLs, cleartextTrafficPermitted=true.' },
        { id: 'cert_pinning', label: 'Missing Certificate Pinning', desc: 'Vulnerable to MITM attacks', promptInstruction: 'Check for certificate pinning: OkHttp CertificatePinner, TrustKit (iOS), or custom TrustManager validating against pinned certificates.' },
        { id: 'ssl_bypass', label: 'SSL Validation Bypass', desc: 'Trust-all certificate code', promptInstruction: 'Check for SSL bypass: custom TrustManagers accepting all certs, HostnameVerifier returning true universally, allowAllHostnames patterns.' },
      ],
    },
    {
      category: 'Platform Specific',
      checks: [
        { id: 'exported_components', label: 'Exported Android Components', desc: 'Unprotected Activities/Providers', promptInstruction: 'Check exported Android components: Activities, Services, BroadcastReceivers, ContentProviders without permission requirements. Especially exported Providers.' },
        { id: 'deep_links', label: 'Deep Link Injection', desc: 'Unvalidated deep link params', promptInstruction: 'Check deep link handling: URL parameters used without validation, unverified app links, cross-app request forgery via deep link manipulation.' },
        { id: 'webview', label: 'WebView Security', desc: 'JavaScript bridge, file access', promptInstruction: 'Check WebView config: addJavascriptInterface (Android), file access enabled, shouldOverrideUrlLoading not implemented, loading untrusted URLs.' },
        { id: 'ipc', label: 'Insecure IPC', desc: 'Unprotected inter-process communication', promptInstruction: 'Check IPC: Binder interfaces without permission checks, unprotected content providers, broadcast intents with sensitive data, implicit intent exposure.' },
      ],
    },
    {
      category: 'Authentication',
      checks: [
        { id: 'biometric', label: 'Biometric Auth Bypass', desc: 'Weak biometric implementation', promptInstruction: 'Check biometric auth: missing CryptoObject binding (Android), missing LAPolicy evaluation (iOS), allowing bypass via accessibility tools.' },
        { id: 'token_storage', label: 'Insecure Token Storage', desc: 'Tokens in plaintext files', promptInstruction: 'Check token storage: OAuth tokens, session tokens, API keys stored in plaintext files vs. platform Keychain/Keystore.' },
        { id: 'root_detection', label: 'Missing Root / Jailbreak Detection', desc: 'App runs on rooted devices', promptInstruction: 'Check for root/jailbreak detection, integrity verification, anti-debugging for sensitive financial or auth operations on compromised devices.' },
      ],
    },
    {
      category: 'Sensitive Data',
      checks: [
        { id: 'hardcoded_keys', label: 'Hardcoded API Keys / Secrets', desc: 'Keys in source or resources', promptInstruction: 'Check for hardcoded API keys, encryption keys, private keys, passwords in source code, strings.xml, plist, or bundled config files.' },
        { id: 'screenshot', label: 'Screenshot / Screen Recording', desc: 'Sensitive screens captured', promptInstruction: 'Check for FLAG_SECURE (Android) / preventScreenCapture (iOS) on screens showing sensitive data like payment, passwords, private keys.' },
      ],
    },
  ],
  desktop_application: [
    {
      category: 'Process & Execution',
      checks: [
        { id: 'cmdi', label: 'Command Injection', desc: 'Shell execution with user input', promptInstruction: 'Check for command injection: user-controlled data in shell.exec, child_process, Command::new, or shell string construction without escaping.' },
        { id: 'ipc_injection', label: 'IPC Message Injection', desc: 'Unvalidated IPC from renderer', promptInstruction: 'Check IPC handlers (Tauri commands, Electron ipcMain): validate and sanitize all data received from renderer processes, enforce allowlists.' },
        { id: 'privilege', label: 'Unnecessary Elevated Privileges', desc: 'App runs as admin', promptInstruction: 'Check for excessive privileges: app requiring admin/root unnecessarily, writing to system directories, UAC bypasses, setuid usage.' },
        { id: 'arg_injection', label: 'Argument Injection', desc: 'User input as CLI arguments', promptInstruction: 'Check for argument injection: user-controlled strings passed as CLI arguments to subprocesses, missing argument sanitization/escaping.' },
      ],
    },
    {
      category: 'File System Security',
      checks: [
        { id: 'path_traversal', label: 'Path Traversal', desc: '../ in user-supplied paths', promptInstruction: 'Check file operations with user-controlled paths: ../ traversal, symlink following, path canonicalization missing, writing outside allowed directories.' },
        { id: 'temp_files', label: 'Insecure Temp Files', desc: 'Sensitive data in temp directories', promptInstruction: 'Check for sensitive data in predictable temp file paths, missing cleanup on exit, world-readable temp files, race conditions (TOCTOU).' },
        { id: 'dll_hijack', label: 'DLL / Library Hijacking', desc: 'Unquoted paths, search order abuse', promptInstruction: 'Check for DLL hijacking: unquoted service paths, DLL search order abuse, writable directories in PATH, insecure binary loading patterns.' },
      ],
    },
    {
      category: 'Data Protection',
      checks: [
        { id: 'local_secrets', label: 'Plaintext Secrets on Disk', desc: 'Credentials in app data files', promptInstruction: 'Check for credentials, tokens, or sensitive data stored in plaintext config files, registry entries, or app data directories.' },
        { id: 'update_integrity', label: 'Insecure Auto-Update', desc: 'Updates without signature verification', promptInstruction: 'Check auto-update mechanism: cryptographic signature verification before applying updates, HTTPS enforcement, update channel pinning.' },
        { id: 'webview_xss', label: 'WebView / WebView2 XSS', desc: 'Injected scripts in embedded browser', promptInstruction: 'Check WebView/WebView2 config: JavaScript enabled for untrusted content, unsafe HTML rendered via loadContent, IPC bridge exposure, navigation to untrusted origins.' },
      ],
    },
    {
      category: 'Input Handling',
      checks: [
        { id: 'url_scheme', label: 'Custom URL Scheme Abuse', desc: 'Unvalidated deep link parameters', promptInstruction: 'Check custom URL scheme handlers: injection via scheme parameters, unvalidated deep link input, cross-app request forgery.' },
        { id: 'clipboard_attack', label: 'Clipboard Injection', desc: 'Malicious clipboard content', promptInstruction: 'Check for clipboard injection: data pasted from clipboard used in file paths, commands, or URLs without sanitization.' },
      ],
    },
  ],
  cloud_infrastructure: [
    {
      category: 'Identity & Access Management',
      checks: [
        { id: 'iam_over', label: 'Overpermissive IAM Roles', desc: 'Wildcard permissions, admin roles', promptInstruction: 'Check IAM roles: wildcard (*) actions/resources in policies, admin managed policies attached to compute, principle of least privilege violations.' },
        { id: 'key_rotation', label: 'No Key / Credential Rotation', desc: 'Long-lived access credentials', promptInstruction: 'Check for long-lived IAM keys, hardcoded access keys in code, missing rotation policies for service accounts, root account access keys active.' },
        { id: 'mfa', label: 'MFA Not Enforced', desc: 'Privileged accounts without MFA', promptInstruction: 'Check MFA enforcement: root account, IAM users with console access, service accounts with sensitive permissions — all should require MFA.' },
        { id: 'crossaccount', label: 'Unsafe Cross-Account Trust', desc: 'Overly permissive assume-role', promptInstruction: 'Check cross-account trust policies: overly broad Principal (*), missing ExternalId condition, overly permissive action list in role trust policies.' },
      ],
    },
    {
      category: 'Storage Security',
      checks: [
        { id: 'public_storage', label: 'Public Cloud Storage', desc: 'S3 / GCS / Azure Blobs open', promptInstruction: 'Check for public storage: S3 Block Public Access disabled, bucket ACLs with AllUsers read, GCS allUsers/allAuthenticatedUsers, Azure anonymous blob access.' },
        { id: 'encryption_rest', label: 'Unencrypted Data at Rest', desc: 'Storage without KMS encryption', promptInstruction: 'Check for unencrypted EBS volumes, RDS instances, S3 buckets (SSE disabled), database snapshots, and backup files.' },
        { id: 'versioning', label: 'Missing Backup & Versioning', desc: 'No point-in-time recovery', promptInstruction: 'Check for missing S3 versioning, RDS automated backups, snapshot lifecycle policies, cross-region replication for critical data.' },
      ],
    },
    {
      category: 'Network Security',
      checks: [
        { id: 'security_groups', label: 'Permissive Security Groups', desc: '0.0.0.0/0 on sensitive ports', promptInstruction: 'Check security groups and NACLs: 0.0.0.0/0 inbound on SSH (22), RDP (3389), databases (3306, 5432, 27017, 6379), admin UIs.' },
        { id: 'public_db', label: 'Publicly Accessible Databases', desc: 'RDS, Redis open to internet', promptInstruction: 'Check for public database instances: RDS publicly_accessible=true, ElastiCache/Redis without VPC, Redshift accessible from internet.' },
        { id: 'vpc_flow', label: 'Missing VPC / Audit Logging', desc: 'No network audit trail', promptInstruction: 'Check for VPC Flow Logs, CloudTrail in all regions, S3 access logging, GuardDuty enabled, centralized log aggregation.' },
      ],
    },
    {
      category: 'Secrets Management',
      checks: [
        { id: 'hardcoded', label: 'Hardcoded Secrets in IaC', desc: 'Keys in Terraform/CloudFormation', promptInstruction: 'Check IaC templates: Terraform, CloudFormation, Pulumi, CDK for hardcoded secrets, access keys, passwords, connection strings.' },
        { id: 'env_secrets', label: 'Plaintext Secrets in Env Vars', desc: 'Secrets in task definitions', promptInstruction: 'Check ECS/EKS task definitions, Lambda environment variables, K8s ConfigMaps for plaintext secrets instead of Secrets Manager/SSM Parameter Store.' },
        { id: 'metadata_ssrf', label: 'Cloud Metadata SSRF', desc: 'SSRF to instance metadata service', promptInstruction: 'Check for SSRF vectors reaching cloud metadata (169.254.169.254), whether IMDSv2 is enforced, and hopcount/token validation.' },
      ],
    },
  ],
  iot_embedded: [
    {
      category: 'Authentication',
      checks: [
        { id: 'default_creds', label: 'Default Credentials', desc: 'Factory passwords unchanged', promptInstruction: 'Check for default usernames/passwords in device config, web interface, MQTT brokers, Telnet, SSH, and management APIs.' },
        { id: 'no_auth', label: 'Missing Authentication', desc: 'Unauthenticated interfaces', promptInstruction: 'Check for unauthenticated device management APIs, web interfaces, debug serial ports, or local network services without auth.' },
        { id: 'weak_crypto', label: 'Weak Cryptography', desc: 'MD5, DES, hardcoded keys', promptInstruction: 'Check for weak algorithms (MD5/DES), hardcoded encryption keys, static IVs, insufficient entropy sources, predictable random number generation.' },
      ],
    },
    {
      category: 'Firmware Security',
      checks: [
        { id: 'no_signing', label: 'No Firmware Signing', desc: 'Updates accepted without verification', promptInstruction: 'Check firmware update: cryptographic signature verification before applying, authenticated update channels, rollback protection, key management.' },
        { id: 'hardcoded_keys', label: 'Hardcoded Keys in Firmware', desc: 'Static symmetric/private keys', promptInstruction: 'Check for hardcoded API keys, SSH keys, TLS private keys, or encryption keys embedded in firmware source, binaries, or configs.' },
        { id: 'debug_interfaces', label: 'Exposed Debug Interfaces', desc: 'UART, JTAG, SWD in production', promptInstruction: 'Check for enabled debug interfaces: UART shell, JTAG/SWD debug ports, Telnet, serial consoles without authentication in production builds.' },
        { id: 'secure_boot', label: 'Insecure Boot Chain', desc: 'No secure boot / verified boot', promptInstruction: 'Check secure boot implementation: bootloader signature verification, Secure Boot enabled, anti-rollback protection, chain of trust.' },
      ],
    },
    {
      category: 'Communication',
      checks: [
        { id: 'cleartext_comm', label: 'Cleartext Communication', desc: 'HTTP, MQTT without TLS', promptInstruction: 'Check for cleartext protocols: HTTP without TLS, MQTT without SSL, CoAP without DTLS, REST over plain TCP.' },
        { id: 'tls_config', label: 'Weak TLS Configuration', desc: 'Old TLS versions, weak ciphers', promptInstruction: 'Check TLS/SSL: TLS 1.0/1.1 support, weak cipher suites, self-signed certs accepted, certificate chain validation missing.' },
        { id: 'pairing', label: 'Insecure Device Pairing', desc: 'Bluetooth/WiFi pairing without auth', promptInstruction: 'Check pairing mechanisms: Bluetooth Just Works pairing, WiFi provisioning without authentication, replay protection missing.' },
      ],
    },
    {
      category: 'Physical & Storage',
      checks: [
        { id: 'storage_encryption', label: 'Unencrypted Storage', desc: 'Flash/EEPROM without encryption', promptInstruction: 'Check for sensitive data stored unencrypted in flash, EEPROM, or file systems extractable via physical access or debug interfaces.' },
        { id: 'jtag_disable', label: 'JTAG / Debug Not Disabled', desc: 'Debug access in production units', promptInstruction: 'Check for JTAG, SWD, UART debug access not disabled in production firmware or hardware fuse settings.' },
      ],
    },
  ],
  network_infrastructure: [
    {
      category: 'Access Control',
      checks: [
        { id: 'mgmt_exposed', label: 'Exposed Management Interfaces', desc: 'SSH, RDP, admin panels open', promptInstruction: 'Check for management interfaces exposed to internet: SSH (22), RDP (3389), SNMP (161), Telnet (23), web admin panels without VPN/IP restriction.' },
        { id: 'weak_creds', label: 'Default / Weak Credentials', desc: 'Factory passwords on devices', promptInstruction: 'Check for default credentials on routers, switches, firewalls, load balancers, monitoring systems, and network management platforms.' },
        { id: 'priv_access', label: 'Privileged Access Controls', desc: 'No MFA, PAM, or jump box', promptInstruction: 'Check privileged access: MFA requirement for admin access, jump server usage, Privileged Access Management, session recording.' },
      ],
    },
    {
      category: 'Protocols',
      checks: [
        { id: 'legacy_proto', label: 'Legacy / Insecure Protocols', desc: 'Telnet, SSLv3, FTP, SNMPv1', promptInstruction: 'Check for insecure protocols: Telnet, FTP, SNMPv1/v2c with community strings, SSLv3, TLS 1.0/1.1, WEP/WPA (WiFi).' },
        { id: 'cipher_suites', label: 'Weak Cipher Suites', desc: 'RC4, DES, EXPORT ciphers', promptInstruction: 'Check TLS cipher config: RC4, DES, 3DES, NULL, EXPORT ciphers, weak DHE key sizes (<2048-bit), missing forward secrecy.' },
        { id: 'snmp', label: 'SNMP Misconfiguration', desc: 'Public community string', promptInstruction: 'Check SNMP: SNMPv1/v2 with default community strings (public/private), SNMP write access, sensitive MIB exposure, SNMPv3 not enforced.' },
        { id: 'dns_sec', label: 'DNS Security', desc: 'Zone transfer, DNSSEC missing', promptInstruction: 'Check DNS: zone transfers allowed from any IP, DNSSEC not configured, DNS cache poisoning mitigations, split-horizon DNS misconfiguration.' },
      ],
    },
    {
      category: 'Segmentation & Firewall',
      checks: [
        { id: 'firewall_rules', label: 'Overpermissive Firewall Rules', desc: 'Any-any permits, missing deny-all', promptInstruction: 'Check firewall rules: any-any permits, missing implicit deny-all, inter-VLAN routing without inspection, flat network without segmentation.' },
        { id: 'vlan', label: 'VLAN Hopping / Misconfiguration', desc: 'VLAN segmentation bypass', promptInstruction: 'Check VLAN config: VLAN hopping via double-tagging, native VLAN on trunks, DTP auto-negotiation enabled, missing VLAN access controls.' },
        { id: 'dmz', label: 'Missing DMZ Architecture', desc: 'Public servers in internal network', promptInstruction: 'Check network architecture: internet-facing services in the same segment as internal systems, missing DMZ for public-facing servers.' },
      ],
    },
    {
      category: 'Monitoring & Logging',
      checks: [
        { id: 'logging', label: 'Insufficient Logging', desc: 'No centralized audit trail', promptInstruction: 'Check logging: centralized syslog to SIEM, authentication event logging, firewall drop logging, failed login alerts, log integrity protection.' },
        { id: 'ids_ips', label: 'Missing IDS / IPS', desc: 'No intrusion detection', promptInstruction: 'Check for network IDS/IPS: perimeter deployment, signature updates, alert tuning, inline prevention mode for critical segments.' },
        { id: 'ntp', label: 'NTP Misconfiguration', desc: 'Unsynchronized clocks, amplification', promptInstruction: 'Check NTP: all devices sync to trusted sources, NTP authentication enabled, monlist disabled to prevent NTP amplification attacks.' },
      ],
    },
  ],
  source_code_library: [
    {
      category: 'API Safety',
      checks: [
        { id: 'unsafe_defaults', label: 'Insecure Default Configuration', desc: 'Dangerous options on init', promptInstruction: 'Check for insecure defaults: dangerous behavior enabled without opt-in, security features requiring explicit configuration, safe=False patterns.' },
        { id: 'prototype_pollution', label: 'Prototype Pollution', desc: 'Object property injection', promptInstruction: 'Check for prototype pollution: recursive object merges, deep merge without property allowlist, __proto__ / constructor handling in object manipulation.' },
        { id: 'regex_dos', label: 'ReDoS Vulnerability', desc: 'Catastrophic regex backtracking', promptInstruction: 'Check for ReDoS: regex patterns with catastrophic backtracking on user input, nested quantifiers, ambiguous groups, exponential worst-case.' },
        { id: 'type_confusion', label: 'Type Confusion', desc: 'Missing type validation', promptInstruction: 'Check for type confusion: functions accepting mixed types without validation, prototype chain manipulation via type coercion.' },
      ],
    },
    {
      category: 'Injection Risks',
      checks: [
        { id: 'eval', label: 'Dynamic Code Execution', desc: 'eval(), exec(), Function()', promptInstruction: 'Check for unsafe dynamic code execution: eval(), Function(), exec(), os.system(), subprocess with shell=True using user-controlled strings.' },
        { id: 'deser', label: 'Unsafe Deserialization', desc: 'Pickle, YAML, XML parsing', promptInstruction: 'Check for unsafe deserialization: pickle.loads(), yaml.load() without SafeLoader, XML with entity expansion, JSON.parse without schema validation.' },
        { id: 'path_ops', label: 'Unsafe Path Operations', desc: 'Path traversal in file utilities', promptInstruction: 'Check file utility functions: path join without normalization, ../ traversal, symlink following, write operations outside intended directory boundaries.' },
        { id: 'injection_sink', label: 'Injection Sinks in Public API', desc: 'SQL/shell sinks in library API', promptInstruction: 'Check public API surface: functions accepting strings passed to SQL queries, shell commands, template engines, XML parsers without clear escaping.' },
      ],
    },
    {
      category: 'Supply Chain',
      checks: [
        { id: 'dep_confusion', label: 'Dependency Confusion Risk', desc: 'Internal package names in public registry', promptInstruction: 'Check for dependency confusion: internal package names not scoped (@org/), missing registry configuration, transitive dependency risks.' },
        { id: 'semver_lock', label: 'Loose Version Pinning', desc: 'No lock file or semver ranges', promptInstruction: 'Check for loose dependency pinning (^, ~, *) without lock files, enabling supply chain compromise through updated transitive dependencies.' },
        { id: 'lifecycle_scripts', label: 'Dangerous Lifecycle Scripts', desc: 'postinstall script execution', promptInstruction: 'Check for npm preinstall/postinstall/prepare scripts executing arbitrary code during package installation as a supply chain risk.' },
      ],
    },
    {
      category: 'Security Primitives',
      checks: [
        { id: 'custom_crypto', label: 'Custom Cryptography', desc: 'Rolling own crypto algorithms', promptInstruction: 'Check for custom cryptographic implementations: custom hash functions, custom encryption, homebrew PRNG instead of established crypto libraries.' },
        { id: 'timing', label: 'Timing Attack Vulnerability', desc: 'Non-constant-time comparisons', promptInstruction: 'Check for timing attacks: string equality for secret/token comparison instead of constant-time hmac.compare/crypto.timingSafeEqual.' },
        { id: 'error_leakage', label: 'Error Information Leakage', desc: 'Stack traces in public exceptions', promptInstruction: 'Check error handling: stack traces, file paths, internal implementation details exposed through library exceptions or error objects.' },
      ],
    },
  ],
  other: [
    {
      category: 'General Security',
      checks: [
        { id: 'secrets', label: 'Hardcoded Secrets', desc: 'API keys, passwords in code', promptInstruction: 'Check for hardcoded credentials, API keys, secrets, tokens committed to source or in config files.' },
        { id: 'injection', label: 'Injection Vulnerabilities', desc: 'SQL, command, template injection', promptInstruction: 'Check for injection: user input in SQL queries, shell commands, template engines, eval functions without sanitization or parameterization.' },
        { id: 'auth', label: 'Authentication & Authorization', desc: 'Access control gaps', promptInstruction: 'Check authentication and authorization: missing guards on sensitive operations, privilege escalation paths, weak session management, IDOR.' },
        { id: 'crypto', label: 'Weak Cryptography', desc: 'Insecure algorithms', promptInstruction: 'Check cryptographic usage: weak algorithms (MD5, SHA1, DES), insufficient key length, static IVs, insecure random number generation.' },
        { id: 'config', label: 'Security Misconfiguration', desc: 'Debug mode, verbose errors', promptInstruction: 'Check configuration: debug mode in production, verbose error messages exposing internals, missing security headers, unnecessary features enabled.' },
        { id: 'data_exposure', label: 'Sensitive Data Exposure', desc: 'PII, secrets in logs or responses', promptInstruction: 'Check for sensitive data exposure: PII in logs, tokens in responses, plaintext credentials in storage, unencrypted sensitive data.' },
      ],
    },
  ],
}
