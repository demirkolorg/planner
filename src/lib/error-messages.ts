// User-friendly error messages for different scenarios

export const ERROR_MESSAGES = {
  // Network and connectivity errors
  NETWORK_ERROR: "İnternet bağlantınızı kontrol edin ve tekrar deneyin",
  TIMEOUT_ERROR: "İstek zaman aşımına uğradı, lütfen tekrar deneyin",
  SERVER_ERROR: "Sunucu hatası oluştu, lütfen daha sonra tekrar deneyin",
  
  // Authentication errors
  AUTH_ERROR: "Oturumunuzun süresi dolmuş, lütfen tekrar giriş yapın",
  PERMISSION_ERROR: "Bu işlemi gerçekleştirmek için yetkiniz bulunmuyor",
  
  // Project errors
  PROJECT: {
    FETCH_FAILED: "Projeler yüklenirken hata oluştu",
    CREATE_FAILED: "Proje oluşturulamadı, lütfen tekrar deneyin",
    UPDATE_FAILED: "Proje güncellenemedi, lütfen tekrar deneyin",
    DELETE_FAILED: "Proje silinemedi, lütfen tekrar deneyin",
    PIN_FAILED: "Proje sabitleme işlemi başarısız",
    NAME_REQUIRED: "Proje adı gerekli",
    NAME_TOO_LONG: "Proje adı çok uzun (maksimum 100 karakter)",
    PROTECTED_PROJECT: "Bu proje korumalı ve düzenlenemez"
  },
  
  // Section errors
  SECTION: {
    FETCH_FAILED: "Bölümler yüklenirken hata oluştu",
    CREATE_FAILED: "Bölüm oluşturulamadı, lütfen tekrar deneyin",
    UPDATE_FAILED: "Bölüm güncellenemedi, lütfen tekrar deneyin",
    DELETE_FAILED: "Bölüm silinemedi, lütfen tekrar deneyin",
    MOVE_FAILED: "Bölüm taşınamadı, lütfen tekrar deneyin",
    NAME_REQUIRED: "Bölüm adı gerekli",
    NAME_TOO_LONG: "Bölüm adı çok uzun (maksimum 100 karakter)"
  },
  
  // Task errors
  TASK: {
    FETCH_FAILED: "Görevler yüklenirken hata oluştu",
    CREATE_FAILED: "Görev oluşturulamadı, lütfen tekrar deneyin",
    UPDATE_FAILED: "Görev güncellenemedi, lütfen tekrar deneyin",
    DELETE_FAILED: "Görev silinemedi, lütfen tekrar deneyin",
    MOVE_FAILED: "Görev taşınamadı, lütfen tekrar deneyin",
    COMPLETE_FAILED: "Görev tamamlanamadı, lütfen tekrar deneyin",
    TITLE_REQUIRED: "Görev başlığı gerekli",
    TITLE_TOO_LONG: "Görev başlığı çok uzun (maksimum 200 karakter)"
  },
  
  // User errors
  USER: {
    FETCH_FAILED: "Kullanıcı bilgileri yüklenirken hata oluştu",
    UPDATE_FAILED: "Kullanıcı bilgileri güncellenemedi",
    EMAIL_INVALID: "Geçerli bir e-posta adresi girin",
    PASSWORD_WEAK: "Şifre en az 8 karakter uzunluğunda olmalı"
  }
}

// Error type detection and message mapping
export function getErrorMessage(error: any, context?: string): string {
  // Network errors
  if (error?.name === 'AbortError' || error?.message?.includes('timeout')) {
    return ERROR_MESSAGES.TIMEOUT_ERROR
  }
  
  if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
    return ERROR_MESSAGES.NETWORK_ERROR
  }
  
  // HTTP status codes
  if (error?.status === 401 || error?.response?.status === 401) {
    return ERROR_MESSAGES.AUTH_ERROR
  }
  
  if (error?.status === 403 || error?.response?.status === 403) {
    return ERROR_MESSAGES.PERMISSION_ERROR
  }
  
  if (error?.status >= 500 || error?.response?.status >= 500) {
    return ERROR_MESSAGES.SERVER_ERROR
  }
  
  // Context-specific errors
  if (context && ERROR_MESSAGES[context as keyof typeof ERROR_MESSAGES]) {
    const contextErrors = ERROR_MESSAGES[context as keyof typeof ERROR_MESSAGES] as any
    
    // Try to match specific error types
    if (error?.message?.includes('required')) {
      return contextErrors.NAME_REQUIRED || contextErrors.TITLE_REQUIRED
    }
    
    if (error?.message?.includes('too long')) {
      return contextErrors.NAME_TOO_LONG || contextErrors.TITLE_TOO_LONG
    }
    
    // Default context error
    if (error?.message?.includes('create')) {
      return contextErrors.CREATE_FAILED
    }
    
    if (error?.message?.includes('update')) {
      return contextErrors.UPDATE_FAILED
    }
    
    if (error?.message?.includes('delete')) {
      return contextErrors.DELETE_FAILED
    }
    
    if (error?.message?.includes('fetch') || error?.message?.includes('load')) {
      return contextErrors.FETCH_FAILED
    }
  }
  
  // Fallback to original error message if it's user-friendly
  if (error?.message && typeof error.message === 'string' && error.message.length < 100) {
    return error.message
  }
  
  // Ultimate fallback
  return "Beklenmeyen bir hata oluştu, lütfen tekrar deneyin"
}

// Success messages
export const SUCCESS_MESSAGES = {
  PROJECT: {
    CREATED: "Proje başarıyla oluşturuldu",
    UPDATED: "Proje başarıyla güncellendi",
    DELETED: "Proje başarıyla silindi",
    PINNED: "Proje sabitlendi",
    UNPINNED: "Proje sabitleme kaldırıldı"
  },
  SECTION: {
    CREATED: "Bölüm başarıyla oluşturuldu",
    UPDATED: "Bölüm başarıyla güncellendi",
    DELETED: "Bölüm başarıyla silindi",
    MOVED: "Bölüm başarıyla taşındı"
  },
  TASK: {
    CREATED: "Görev başarıyla oluşturuldu",
    UPDATED: "Görev başarıyla güncellendi",
    DELETED: "Görev başarıyla silindi",
    COMPLETED: "Görev tamamlandı",
    MOVED: "Görev başarıyla taşındı"
  }
}