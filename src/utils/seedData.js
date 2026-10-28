import { validateSnapshot } from '@/utils/dataPort'

export const seedSnapshot = {
  exams: [
    {
      id: 'seed-exam-1',
      name: '高等数学（期末考试）',
      examDate: '2026-12-15',
      note: '涵盖极限、导数、积分及应用',
      createdAt: '2026-10-26T08:00:00.000Z'
    },
    {
      id: 'seed-exam-2',
      name: '大学英语（四级模拟）',
      examDate: '2026-11-20',
      note: '听力、阅读、写作、翻译',
      createdAt: '2026-10-26T08:01:00.000Z'
    }
  ],
  tasks: [
    {
      id: 'seed-task-1',
      examId: 'seed-exam-1',
      content: '复习极限与连续性定义',
      done: true,
      createdAt: '2026-10-26T08:02:00.000Z'
    },
    {
      id: 'seed-task-2',
      examId: 'seed-exam-1',
      content: '练习导数与微分计算题',
      done: false,
      createdAt: '2026-10-26T08:03:00.000Z'
    },
    {
      id: 'seed-task-3',
      examId: 'seed-exam-1',
      content: '复习定积分与不定积分',
      done: false,
      createdAt: '2026-10-26T08:04:00.000Z'
    },
    {
      id: 'seed-task-4',
      examId: 'seed-exam-2',
      content: '背诵核心高频词汇',
      done: true,
      createdAt: '2026-10-26T08:05:00.000Z'
    },
    {
      id: 'seed-task-5',
      examId: 'seed-exam-2',
      content: '练习听力真题两套',
      done: false,
      createdAt: '2026-10-26T08:06:00.000Z'
    }
  ]
}

try {
  const _check = validateSnapshot(seedSnapshot)
  if (!_check.valid) {
    console.error('[seedData] 种子数据校验失败:', _check.reason)
  }
} catch (_e) {
  // 非浏览器环境跳过校验
}

export default seedSnapshot