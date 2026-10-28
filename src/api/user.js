import request from '@/utils/request'

export async function getMe() {
  const { data } = await request.get('/me')
  return data
}