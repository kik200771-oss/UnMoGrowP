package middleware

import (
  "context"
  "net/http"
)

type ctxKey string

const CtxTenantID ctxKey = "tenant_id"

func WithTenant(next http.Handler) http.Handler {
  return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
    tid := r.Header.Get("X-Tenant-ID")
    if tid == "" {
      http.Error(w, "missing tenant", http.StatusUnauthorized)
      return
    }
    ctx := context.WithValue(r.Context(), CtxTenantID, tid)
    next.ServeHTTP(w, r.WithContext(ctx))
  })
}