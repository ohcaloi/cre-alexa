# CRE Alexa Permission Matrix

| Action | Visitor | Standard | Premium | Sponsor | Admin | Enforcement point |
| --- | --- | --- | --- | --- | --- | --- |
| Browse approved vendor listings | Yes | Yes | Yes | Yes | Yes | Public CMS query filters `approved` and `published` |
| View premium content | No | No | Yes | Configurable | Yes | Server entitlement guard |
| Register for public event | Eligible by event rules | Eligible by event rules | Eligible by event rules | Eligible by event rules | Manage | Server event eligibility guard |
| Register for premium event | No | No | Yes | Configurable | Manage | Server entitlement guard before registration |
| Start vendor application | No | Yes | Yes | Configurable | Manage | Server membership and status check |
| Edit own vendor draft | No | Own record | Own record | Own record if enabled | Any | Owner ID and field allowlist |
| Publish vendor listing | No | No | No | No | Yes | Admin approval workflow only |
| View résumé | Own file only | Own file only | Own file only | Own file only | Authorized | Signed or authorized download endpoint |
| View sponsor dashboard | No | No | No | Own sponsor data | Any | Role plus owner relationship check |
| Edit venue or parking records | No | No | No | No | Yes | Admin server route |
| Change entitlement status | No | No | No | No | System or admin | Idempotent server workflow |

The client may hide unavailable actions for usability. It never grants access. Every restricted resource and write repeats this matrix on the server.
