# DEBT-010 — SPIVault no filtra por tipos vault

| Field        | Value                          |
|--------------|--------------------------------|
| Captured     | 2026-04-27                     |
| Severity     | Low                            |
| Status       | Open                           |
| File(s)      | src/pages/SPIVault.tsx:38-45   |
| Blocker?     | Post-pilot                     |
| Effort       | S                              |

## Problem
ClientVault filtra a tipos de bóveda (poder_legal, cedula,
certificado_constitucion). SPIVault muestra cualquier documento
que el store clasifique como vault, lo que puede incluir tipos
no-vault si hay inconsistencia.

## Proposed solution
Añadir filtro en SPIVault.tsx:
  const filtered = vaultDocuments.filter(d =>
    ['poder_legal', 'cedula', 'certificado_constitucion'].includes(d.type)
  );
