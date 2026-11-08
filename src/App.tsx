import { useEffect, useMemo, useState } from 'react'
import {
  CHANNEL_NAME,
  DAY_SEED,
  type Channel,
  fmtTime,
  generateDay,
  loadClock,
  saveClock,
  simNow,
  todayKey,
  won,
} from './sim'

type Status = '신규' | '처리완료'

function loadStatus(): Record<string, Status> {
  try {
    return JSON.parse(localStorage.getItem('orderStatus') || '{}')
  } catch {
    return {}
  }
}

export default function App() {
  const [clock, setClock] = useState(loadClock)
  const [now, setNow] = useState(() => simNow(clock))
  const [status, setStatus] = useState<Record<string, Status>>(loadStatus)
  const [filter, setFilter] = useState<'all' | Channel>('all')
  const [toast, setToast] = useState('')

  const all = useMemo(() => generateDay(DAY_SEED, todayKey()), [])

  useEffect(() => {
    const t = setInterval(() => setNow(simNow(clock)), 1000)
    return () => clearInterval(t)
  }, [clock])

  const visible = all
    .filter((o) => o.at <= now)
    .filter((o) => filter === 'all' || o.channel === filter)
    .slice()
    .reverse()

  function done(id: string) {
    const next = { ...status, [id]: '처리완료' as Status }
    setStatus(next)
    localStorage.setItem('orders_status', JSON.stringify(next))
    setToast('저장되었습니다!')
    setTimeout(() => setToast(''), 1500)
  }

  function testOrder() {
    const next = all.find((o) => o.at > now)
    if (!next) return
    const c = { ...clock, offsetSec: clock.offsetSec + (next.at - now) * 60 + 1 }
    saveClock(c)
    setClock(c)
    setNow(simNow(c))
  }

  const count = (ch: Channel) => all.filter((o) => o.at <= now && o.channel === ch).length

  return (
    <div className="wrap">
      <h1>배달 주문 모아보기</h1>
      <div className="bar">
        <span>현재 시각 {fmtTime(now)}</span>
        <span>
          주걱 {count('jugeok')}건 / 빨리와 {count('ppalliwa')}건 / 동네배달 {count('dongnae')}건
        </span>
        <select value={filter} onChange={(e) => setFilter(e.target.value as 'all' | Channel)}>
          <option value="all">전체</option>
          <option value="jugeok">주걱</option>
          <option value="ppalliwa">빨리와</option>
          <option value="dongnae">동네배달</option>
        </select>
        <button onClick={testOrder}>테스트 주문</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>앱</th>
            <th>주문번호</th>
            <th>시간</th>
            <th>메뉴</th>
            <th>요청사항</th>
            <th>주소</th>
            <th>금액</th>
            <th>상태</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((o) => (
            <tr key={o.id}>
              <td>{CHANNEL_NAME[o.channel]}</td>
              <td>{o.id}</td>
              <td>{fmtTime(o.at)}</td>
              <td>
                {o.items.map((i) => `${i.name} ${i.qty}${i.options.length ? ` (${i.options.join(', ')})` : ''}`).join(', ')}
              </td>
              <td className="req">{o.request}</td>
              <td>{o.address}</td>
              <td>{won(o.total)}</td>
              <td>
                {status[o.id] === '처리완료' ? (
                  '처리완료'
                ) : (
                  <button onClick={() => done(o.id)}>처리</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {visible.length === 0 && <p>주문이 없습니다</p>}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
