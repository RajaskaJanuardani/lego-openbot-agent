---
name: lego-house-presence
description: Laporkan status working/idle agent OpenBot secara real-time ke website 3D LEGO Tropical House lewat LEGO Bridge.
---

# LEGO Tropical House Presence Skill

Laporkan kehadiran dan status kerjamu ke diorama 3D **LEGO Tropical House** sehingga karakter minifigure-mu berjalan ke **Ruang Kerja (Lantai 1)** saat bekerja dan kembali santai/mengobrol saat idle.

## Prasyarat Environment Variable
Pastikan tersedia dua environment variable berikut (JANGAN menaruh token langsung di teks skill atau log):
- `LEGO_BRIDGE_URL` — contoh: `http://localhost:4310`
- `LEGO_BRIDGE_TOKEN` — bearer token yang sama dengan `BRIDGE_TOKEN` di server bridge

Gunakan `agentId` yang konsisten sesuai namamu dalam huruf kecil tanpa spasi (misal: `ada`, `kai`, `nadia`).

---

## Aturan Pelaporan

1. **Saat pertama kali memakai skill ini** (atau nama/role berubah), panggil `/api/agents/register` dengan nama dan role-mu.
2. **Saat mulai mengerjakan task**, kirim `status: "working"` dengan ringkasan task singkat **1 kalimat bahasa Indonesia (maks 140 karakter)** tanpa data rahasia.
3. **Saat task selesai, gagal, dibatalkan, atau menunggu input user**, segera kirim `status: "idle"`.
4. *(Opsional untuk task > 15 menit)* Kirim `/api/agents/<agentId>/heartbeat`.

---

## Perintah Windows PowerShell (Prioritas di Windows)

### Register profil:
```powershell
$headers = @{ Authorization = "Bearer $env:LEGO_BRIDGE_TOKEN" }
$body = @{
  agentId = "<agentId>"
  name    = "<Nama Agent>"
  title   = "<Role / Title Agent>"
} | ConvertTo-Json
Invoke-RestMethod -Uri "$env:LEGO_BRIDGE_URL/api/agents/register" -Method Post -Headers $headers -ContentType "application/json" -Body $body
```

### Mulai bekerja (`working`):
```powershell
$headers = @{ Authorization = "Bearer $env:LEGO_BRIDGE_TOKEN" }
$body = @{
  status = "working"
  task   = "Ringkasan task 1 kalimat bahasa Indonesia"
} | ConvertTo-Json
Invoke-RestMethod -Uri "$env:LEGO_BRIDGE_URL/api/agents/<agentId>/status" -Method Post -Headers $headers -ContentType "application/json" -Body $body
```

### Selesai / menunggu input (`idle`):
```powershell
$headers = @{ Authorization = "Bearer $env:LEGO_BRIDGE_TOKEN" }
$body = @{ status = "idle" } | ConvertTo-Json
Invoke-RestMethod -Uri "$env:LEGO_BRIDGE_URL/api/agents/<agentId>/status" -Method Post -Headers $headers -ContentType "application/json" -Body $body
```

---

## Perintah Bash / macOS / Linux

### Register profil:
```bash
curl -sS -X POST "$LEGO_BRIDGE_URL/api/agents/register" \
  -H "Authorization: Bearer $LEGO_BRIDGE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"agentId":"<agentId>","name":"<Nama Agent>","title":"<Role / Title Agent>"}'
```

### Mulai bekerja (`working`):
```bash
curl -sS -X POST "$LEGO_BRIDGE_URL/api/agents/<agentId>/status" \
  -H "Authorization: Bearer $LEGO_BRIDGE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"working","task":"Ringkasan task 1 kalimat bahasa Indonesia"}'
```

### Selesai (`idle`):
```bash
curl -sS -X POST "$LEGO_BRIDGE_URL/api/agents/<agentId>/status" \
  -H "Authorization: Bearer $LEGO_BRIDGE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"idle"}'
```
