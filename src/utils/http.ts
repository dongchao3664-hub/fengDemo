import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

interface RequestConfig extends AxiosRequestConfig {
  showLoading?: boolean
  showError?: boolean
}

class HttpClient {
  private instance: AxiosInstance

  constructor() {
    this.instance = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // 请求拦截器
    this.instance.interceptors.request.use(
      (config) => {
        // 可在此处添加 token
        const token = localStorage.getItem('token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('HTTP Error:', error)
        return Promise.reject(error)
      }
    )
  }

  get<T = any>(url: string, config?: RequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.get<T>(url, config)
  }

  post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.post<T>(url, data, config)
  }

  put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.put<T>(url, data, config)
  }

  delete<T = any>(url: string, config?: RequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.delete<T>(url, config)
  }

  patch<T = any>(url: string, data?: any, config?: RequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.patch<T>(url, data, config)
  }
}

export default new HttpClient()
