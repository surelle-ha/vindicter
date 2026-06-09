# Vulnerability Assessment and Penetration Testing (VAPT) Process

## 1. Scope Definition

Define the systems, applications, and infrastructure that will be tested.

### Common Targets

* Web Applications
* APIs
* Mobile Applications
* Servers
* Databases
* Cloud Infrastructure
* Source Code Repositories
* Internal and External Networks

### Objectives

* Identify security weaknesses
* Validate security controls
* Assess overall security posture
* Determine potential business impact

---

## 2. Information Gathering

Collect information about the target environment to understand its architecture and attack surface.

### Activities

* Discover exposed endpoints
* Identify technologies and frameworks
* Enumerate open ports and services
* Review HTTP headers
* Determine software versions
* Map API routes
* Analyze authentication and login flows
* Identify publicly accessible resources

### Common Tools

* Nmap
* WhatWeb
* Wappalyzer
* Burp Suite
* Amass
* Subfinder

---

## 3. Automated Scanning

Use automated tools to identify common vulnerabilities and misconfigurations.

### Vulnerabilities Commonly Detected

* SQL Injection (SQLi)
* Cross-Site Scripting (XSS)
* Cross-Site Request Forgery (CSRF)
* Security Misconfigurations
* Weak Security Headers
* Exposed Sensitive Files
* Outdated Dependencies
* Misconfigured CORS Policies
* Insecure Cookies
* Missing Rate Limiting
* Known CVEs

### Common Tools

* OWASP ZAP
* Burp Suite Scanner
* Nessus
* Nuclei
* Nikto
* Trivy
* Snyk

---

## 4. Manual Testing

Perform manual verification and business logic testing that automated scanners cannot reliably detect.

### Areas of Focus

* Authentication Bypass
* Authorization Bypass
* Insecure Direct Object References (IDOR)
* Privilege Escalation
* Broken Access Control
* Business Logic Flaws
* Account Takeover Scenarios
* Payment Manipulation
* Session Management Issues
* Multi-Tenant Isolation Weaknesses

### Example Test Cases

* Can a user access another user's data by modifying an identifier?
* Can a low-privilege user perform administrator actions?
* Can payment values be manipulated before processing?

---

## 5. Exploitation and Validation

Verify whether identified vulnerabilities can be successfully exploited.

### Goals

* Confirm vulnerability existence
* Assess exploitability
* Determine potential impact
* Eliminate false positives

### Example

A tester changes:

```http
GET /api/invoices/1001
```

to:

```http
GET /api/invoices/1002
```

If another user's invoice becomes accessible, an IDOR vulnerability exists.

---

## 6. Reporting

Document all confirmed findings and provide remediation guidance.

### Report Contents

* Vulnerability Name
* Severity Rating
* Risk Score
* Affected Asset
* Affected URL or API Endpoint
* Technical Description
* Proof of Concept (PoC)
* Reproduction Steps
* Business Impact
* Recommended Remediation

### Severity Levels

* Critical
* High
* Medium
* Low
* Informational

---

## 7. Remediation

Developers implement fixes for confirmed vulnerabilities.

### Common Remediation Actions

* Validate and sanitize input
* Use parameterized queries
* Implement authorization checks
* Secure session handling
* Configure secure cookies
* Apply security headers
* Update vulnerable dependencies
* Restrict CORS policies
* Implement rate limiting
* Enforce least-privilege access

### Example Fixes

#### SQL Injection

Vulnerable:

```sql
SELECT * FROM users WHERE email = '$email'
```

Secure:

```sql
SELECT * FROM users WHERE email = ?
```

#### Authorization

Before:

```javascript
return Invoice.find(req.params.id);
```

After:

```javascript
return Invoice.findOne({
    id: req.params.id,
    user_id: req.user.id
});
```

---

## 8. Retesting

After remediation, security testers verify that vulnerabilities have been properly fixed.

### Objectives

* Confirm successful remediation
* Ensure no bypass exists
* Verify no new vulnerabilities were introduced
* Validate security controls remain effective

### Outcomes

* Vulnerability Closed
* Vulnerability Partially Fixed
* Vulnerability Reopened
* Additional Findings Identified

---

# Typical VAPT Workflow

```text
Application Development
          ↓
Static Code Review (SAST)
          ↓
Dependency Scanning
          ↓
Dynamic Security Testing (DAST)
          ↓
Manual Penetration Testing
          ↓
Report Generation
          ↓
Developer Remediation
          ↓
Retesting and Validation
          ↓
Final Security Sign-Off
```
