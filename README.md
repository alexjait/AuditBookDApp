# AuditBookDApp
Audit book descentralized application

This DApp includes three actors: the administrator, the auditing company and the auditable company.

The administrator approves or rejects auditing and auditable companies.

Auditing companies can send findings to auditable companies.

Auditable companies can accept or reject the finding.


These DApp works with AuditBookContract (https://github.com/alexjait/AuditBookContract)

Copy AuditBook.json from AuditBookContract\artifacts\contracts\AuditBook.sol and paste in AuditBookDApp\src\contracts

## App.js

Paste de contract address here: 

const contractAddress = 'THE CONTRACT ADDRESS FROM AuditBookContract'; 
