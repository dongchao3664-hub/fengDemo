/**
 * 3D 模型 API 接口
 */

import http from '@/utils/http'

export interface ModelInfo {
  id: string
  name: string
  type: 'gltf' | 'obj' | '3dtiles'
  url: string
  size: number
  vertices?: number
  triangles?: number
  textures?: number
  metadata?: Record<string, any>
}

export interface ModelDetail extends ModelInfo {
  bounds: {
    min: { x: number; y: number; z: number }
    max: { x: number; y: number; z: number }
  }
  center: { x: number; y: number; z: number }
  scale: number
  animations?: Array<{
    name: string
    duration: number
  }>
  materials?: Array<{
    name: string
    type: string
  }>
}

/** 获取模型信息 */
export const getModelInfo = (modelId: string) => {
  return http.get<ModelInfo>(`/api/models/${modelId}`)
}

/** 获取模型详情（包括几何和材质信息） */
export const getModelDetail = (modelId: string) => {
  return http.get<ModelDetail>(`/api/models/${modelId}/detail`)
}

/** 获取模型文件 URL */
export const getModelUrl = (modelId: string) => {
  return http.get<{ url: string; format: string }>(`/api/models/${modelId}/url`)
}

/** 上传模型 */
export const uploadModel = (formData: FormData) => {
  return http.post<ModelInfo>('/api/models/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

/** 获取模型列表 */
export const getModels = (query?: { type?: string; page?: number; pageSize?: number }) => {
  return http.get<{
    data: ModelInfo[]
    total: number
  }>('/api/models', { params: query })
}

/** 删除模型 */
export const deleteModel = (modelId: string) => {
  return http.delete(`/api/models/${modelId}`)
}

/** 验证模型文件 */
export const validateModel = (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return http.post<{
    valid: boolean
    message: string
    info?: ModelInfo
  }>('/api/models/validate', formData)
}

/** 预处理模型（优化、压缩等） */
export const preprocessModel = (modelId: string, options?: {
  optimize?: boolean
  compress?: boolean
  generateLOD?: boolean
}) => {
  return http.post<{ taskId: string; status: string }>(
    `/api/models/${modelId}/preprocess`,
    options
  )
}

/** 获取预处理任务状态 */
export const getPreprocessTaskStatus = (taskId: string) => {
  return http.get<{
    taskId: string
    status: 'pending' | 'processing' | 'completed' | 'failed'
    progress?: number
    result?: ModelInfo
    error?: string
  }>(`/api/models/tasks/${taskId}`)
}
