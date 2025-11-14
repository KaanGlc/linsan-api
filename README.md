# Linsan API

## Kurulum

1. `.env` dosyası oluştur ve gerekli değişkenleri ekle:
```
MONGODB_URI=mongodb+srv://...
SALT=random-salt-string
MASTER_KEY=master-key-for-admin-creation
```

2. İlk admin kullanıcısını oluştur:
```bash
curl -X POST https://your-domain.vercel.app/api/create-admin \
  -H "Content-Type: application/json" \
  -d '{
    "masterKey": "your-master-key",
    "username": "admin",
    "password": "secure-password"
  }'
```

## API Endpoints

- `POST /api/login` - Admin girişi
- `POST /api/verify-session` - Session doğrulama
- `POST /api/create-admin` - Yeni admin oluşturma (master key gerekli)
- `GET /api/feedbacks` - Geri bildirimleri listele (token gerekli)
- `POST /api/feedback` - Geri bildirim gönder
- `GET /api/updates` - Güncelleme kontrolü
- `GET /api/status` - Sunucu durumu

## Güvenlik

- Şifreler SHA-256 ile hash'leniyor
- Session token'lar 24 saat geçerli
- Admin paneli token bazlı korumalı
