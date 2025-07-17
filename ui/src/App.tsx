import React, { useState, useEffect } from 'react'
import { Input } from './components/ui/input'
import { Button } from './components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { Badge } from './components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './components/ui/tooltip'
import { Separator } from './components/ui/separator'
import { Toaster } from './components/ui/sonner'
import { toast } from 'sonner'
import {
  File,
  Download,
  ArrowLeftRight,
  Trash,
  History,
  Filter,
} from 'lucide-react'

interface TokenizeResult {
  words: string[]
  count: number
  cost_ms: number
}

interface HistoryItem {
  path: string
  words: string[]
  leftWords: string[]
  rightWords: string[]
  time: number
  cost_ms: number
}

function getHistory(): HistoryItem[] {
  try {
    return JSON.parse(localStorage.getItem('tokenize_history') || '[]')
  } catch {
    return []
  }
}

function saveHistory(item: HistoryItem) {
  const history = getHistory()
  history.unshift(item)
  localStorage.setItem('tokenize_history', JSON.stringify(history.slice(0, 20)))
}

function updateLatestHistory(leftWords: string[], rightWords: string[]) {
  const history = getHistory()
  if (history.length > 0) {
    history[0].leftWords = leftWords
    history[0].rightWords = rightWords
    localStorage.setItem('tokenize_history', JSON.stringify(history))
  }
}

function deleteHistory(idx: number) {
  const history = getHistory()
  history.splice(idx, 1)
  localStorage.setItem('tokenize_history', JSON.stringify(history))
}

const BADGES_PER_PAGE = 100

const App: React.FC = () => {
  const [path, setPath] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [leftWords, setLeftWords] = useState<string[]>([])
  const [rightWords, setRightWords] = useState<string[]>([])
  const [cost, setCost] = useState<number | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [minLength, setMinLength] = useState(1)
  const [deleteIdx, setDeleteIdx] = useState<number | null>(null)
  const [leftPage, setLeftPage] = useState(1)

  useEffect(() => {
    setHistory(getHistory())
  }, [])

  const handleTokenize = async () => {
    setLoading(true)
    setError('')
    setLeftWords([])
    setRightWords([])
    setCost(null)
    try {
      const res = await fetch('/api/tokenize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      })
      if (!res.ok) {
        throw new Error(await res.text())
      }
      const data: TokenizeResult = await res.json()
      setLeftWords(data.words)
      setRightWords([])
      setCost(data.cost_ms)
      const item: HistoryItem = {
        path,
        words: data.words,
        leftWords: data.words,
        rightWords: [],
        time: Date.now(),
        cost_ms: data.cost_ms,
      }
      saveHistory(item)
      setHistory(getHistory())
      toast.success('分词成功，已加入历史记录！')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error')
      toast.error('分词失败，请检查路径或后端服务')
    } finally {
      setLoading(false)
    }
  }

  const handleHistoryClick = (item: HistoryItem) => {
    setPath(item.path)
    setLeftWords(item.leftWords)
    setRightWords(item.rightWords)
    setCost(item.cost_ms)
    toast('已恢复历史分词')
  }

  // 分页后的左侧分词
  const filteredLeftWords = leftWords.filter((w) => w.length >= minLength)
  const leftTotalPages = Math.max(
    1,
    Math.ceil(filteredLeftWords.length / BADGES_PER_PAGE)
  )
  const leftPageWords = filteredLeftWords.slice(
    (leftPage - 1) * BADGES_PER_PAGE,
    leftPage * BADGES_PER_PAGE
  )

  const moveWord = (word: string, fromLeft: boolean) => {
    if (fromLeft) {
      const newLeft = leftWords.filter((w) => w !== word)
      const newRight = [...rightWords, word]
      setLeftWords(newLeft)
      setRightWords(newRight)
      updateLatestHistory(newLeft, newRight)
    } else {
      const newRight = rightWords.filter((w) => w !== word)
      const newLeft = [...leftWords, word]
      setLeftWords(newLeft)
      setRightWords(newRight)
      updateLatestHistory(newLeft, newRight)
    }
  }

  // 导出 JSON
  function downloadJson(data: any, filename: string) {
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success(`导出 ${filename} 成功！`)
  }

  // 删除历史确认
  const confirmDelete = (idx: number) => {
    setDeleteIdx(idx)
  }
  const doDelete = () => {
    if (deleteIdx !== null) {
      deleteHistory(deleteIdx)
      setHistory(getHistory())
      setDeleteIdx(null)
      toast.success('已删除历史记录')
    }
  }
  const cancelDelete = () => setDeleteIdx(null)

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-white flex flex-col items-center p-0 sm:p-8">
        <Toaster position="top-center" richColors />
        {/* 顶部标题 */}
        <div className="w-full max-w-5xl text-center mt-8 mb-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-700 tracking-tight mb-2 drop-shadow-lg">
            分词工具
          </h1>
          <p className="text-gray-500 text-base sm:text-lg">
            支持文件路径分词、分词历史、左右分区管理与导出，现代化体验
          </p>
        </div>
        {/* 主体两列布局 */}
        <div className="w-full max-w-6xl flex flex-col md:flex-row gap-6">
          {/* 左侧：历史+操作区 */}
          <div className="flex flex-col gap-6 w-full md:w-80 shrink-0">
            {/* 历史记录区域 */}
            <Card className="shadow-xl border-0 bg-white/90 max-h-64 overflow-y-auto">
              <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <History className="text-blue-400" size={20} />
                <span className="font-bold text-base">分词历史</span>
                <span className="text-xs text-gray-400">（点击可恢复）</span>
              </CardHeader>
              <Separator />
              <CardContent className="flex flex-wrap gap-2 mt-2">
                {history.length === 0 && (
                  <span className="text-gray-400">暂无历史</span>
                )}
                {history.map((item, idx) => (
                  <span
                    key={item.path + item.time}
                    className="flex items-center gap-1 group relative"
                  >
                    <Badge
                      className="cursor-pointer bg-gradient-to-r from-blue-200 to-purple-200 hover:from-blue-300 hover:to-purple-300 text-blue-900 px-2 py-1 mb-1 shadow-sm transition-all"
                      onClick={() => handleHistoryClick(item)}
                    >
                      <span className="font-mono text-xs max-w-[120px] truncate inline-block align-middle">
                        {item.path}
                      </span>
                      <span className="ml-2 text-xs text-gray-500">
                        {item.words.length}词
                      </span>
                      <span className="ml-2 text-xs text-gray-400">
                        {new Date(item.time).toLocaleTimeString()}
                      </span>
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => confirmDelete(idx)}
                      tabIndex={-1}
                      aria-label="删除"
                    >
                      <Trash size={16} />
                    </Button>
                    {/* 删除确认弹窗 */}
                    {deleteIdx === idx && (
                      <div className="absolute z-10 top-8 left-1/2 -translate-x-1/2 bg-white border rounded shadow-lg px-4 py-2 flex flex-col items-center animate-fade-in">
                        <span className="text-sm mb-2">确认删除？</span>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={doDelete}
                          >
                            删除
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelDelete}
                          >
                            取消
                          </Button>
                        </div>
                      </div>
                    )}
                  </span>
                ))}
              </CardContent>
            </Card>
            {/* 分词操作区 */}
            <Card className="shadow-lg border-0 bg-white/95">
              <CardHeader className="flex flex-row items-center gap-2">
                <File className="text-blue-500" size={22} />
                <CardTitle className="text-lg font-semibold">
                  分词操作
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 items-center">
                  <div className="relative flex-1">
                    <Input
                      placeholder="输入文件路径"
                      value={path}
                      onChange={(e) => setPath(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleTokenize()}
                      disabled={loading}
                      className="pl-9"
                    />
                    <File
                      className="absolute left-2 top-1/2 -translate-y-1/2 text-blue-300"
                      size={18}
                    />
                  </div>
                  <Button
                    onClick={handleTokenize}
                    disabled={loading || !path}
                    className="gap-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold shadow-md hover:from-blue-600 hover:to-purple-600 transition-all"
                  >
                    <ArrowLeftRight size={16} />
                    {loading ? '分词中...' : '分词'}
                  </Button>
                </div>
                {error && <div className="text-red-500 mt-2">{error}</div>}
                {cost !== null && (
                  <div className="text-gray-500 mt-2 text-sm">
                    分词耗时：{cost} ms
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          {/* 右侧：分词管理区，两栏 */}
          <div className="flex-1 flex flex-col gap-6">
            <div className="flex gap-6 flex-col md:flex-row">
              {/* 左侧分词 */}
              <Card className="flex-1 shadow-lg flex flex-col border-0 bg-white/90 rounded-2xl min-h-[420px]">
                <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
                  <span className="font-bold text-lg">
                    左侧分词（{filteredLeftWords.length}）
                  </span>
                  <div className="flex items-center gap-2">
                    <Filter className="text-blue-400" size={18} />
                    <span className="text-sm text-gray-600">
                      最小分词长度：
                    </span>
                    <Input
                      type="number"
                      min={1}
                      value={minLength}
                      onChange={(e) => {
                        setMinLength(Number(e.target.value) || 1)
                        setLeftPage(1)
                      }}
                      className="w-16 h-8 text-base px-2"
                    />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            downloadJson(filteredLeftWords, 'left-words.json')
                          }
                          disabled={filteredLeftWords.length === 0}
                          className="hover:bg-blue-100 ml-2"
                        >
                          <Download size={18} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>导出左侧分词为 JSON</TooltipContent>
                    </Tooltip>
                  </div>
                </CardHeader>
                <Separator />
                <CardContent className="flex flex-col flex-1 justify-between p-6">
                  <div className="flex flex-wrap gap-3 mb-4 min-h-[120px]">
                    {leftPageWords.length === 0 && (
                      <span className="text-gray-400">暂无分词</span>
                    )}
                    {leftPageWords.map((w) => (
                      <Badge
                        key={w}
                        className="cursor-pointer select-none px-3 py-2 text-base bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 hover:scale-110 hover:from-blue-200 hover:to-purple-200 transition-transform shadow-sm rounded-xl"
                        onClick={() => moveWord(w, true)}
                      >
                        {w}
                      </Badge>
                    ))}
                  </div>
                  {/* 分页器 */}
                  {leftTotalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={leftPage === 1}
                        onClick={() => setLeftPage(leftPage - 1)}
                      >
                        &lt;
                      </Button>
                      <span className="text-sm text-gray-500">
                        {leftPage} / {leftTotalPages}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={leftPage === leftTotalPages}
                        onClick={() => setLeftPage(leftPage + 1)}
                      >
                        &gt;
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              {/* 右侧分词 */}
              <Card className="flex-1 shadow-lg flex flex-col border-0 bg-white/90 rounded-2xl min-h-[420px]">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <span className="font-bold text-lg">
                    右侧分词（{rightWords.length}）
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          downloadJson(rightWords, 'right-words.json')
                        }
                        disabled={rightWords.length === 0}
                        className="hover:bg-green-100"
                      >
                        <Download size={18} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>导出右侧分词为 JSON</TooltipContent>
                  </Tooltip>
                </CardHeader>
                <Separator />
                <CardContent className="flex flex-col flex-1 justify-center p-6">
                  <div className="flex flex-wrap gap-3 min-h-[120px] items-center justify-start">
                    {rightWords.length === 0 ? (
                      <span className="text-gray-300 text-lg mx-auto">
                        请点击左侧分词移动到这里
                      </span>
                    ) : (
                      rightWords.map((w) => (
                        <Badge
                          key={w}
                          className="cursor-pointer select-none px-3 py-2 text-base bg-gradient-to-r from-green-100 to-blue-100 text-green-700 hover:scale-110 hover:from-green-200 hover:to-blue-200 transition-transform shadow-sm rounded-xl"
                          onClick={() => moveWord(w, false)}
                        >
                          {w}
                        </Badge>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        <div className="h-8" />
      </div>
    </TooltipProvider>
  )
}

export default App
