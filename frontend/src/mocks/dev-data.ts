/**
 * Development mode mock data
 *
 * Use phone number +1000000000 to trigger dev mode
 * This provides sample data for UI development without real Telegram auth
 */

// Dev mode phone number
export const DEV_PHONE_NUMBER = '+1000000000'
export const DEV_PHONE_CODE = '12345'
export const DEV_PHONE_HASH = 'dev_hash_mock'

// Mock user
export const DEV_USER = {
  id: 'dev-user-001',
  phone_number: DEV_PHONE_NUMBER,
  telegram_user_id: 123456789,
  created_at: new Date().toISOString(),
}

// Mock JWT token (not a real token, just for dev mode detection)
export const DEV_TOKEN = 'dev_mode_token_feedub_2024'

// Sample chats with realistic Telegram channel IDs
export const DEV_CHATS = [
  {
    chatId: 'chat-1',
    title: 'Tech News Channel',
    type: 'channel' as const,
    telegramChannelId: -1001234567890,
  },
  {
    chatId: 'chat-2',
    title: 'Startup Founders',
    type: 'supergroup' as const,
    telegramChannelId: -1001234567891,
  },
  {
    chatId: 'chat-3',
    title: 'Family Group',
    type: 'group' as const,
    telegramChannelId: -1001234567892,
  },
  { chatId: 'chat-4', title: 'Alice Smith', type: 'private' as const, telegramChannelId: 100001 },
  {
    chatId: 'chat-5',
    title: 'Crypto Signals',
    type: 'channel' as const,
    telegramChannelId: -1001234567893,
  },
  {
    chatId: 'chat-6',
    title: 'Work Team',
    type: 'supergroup' as const,
    telegramChannelId: -1001234567894,
  },
  { chatId: 'chat-7', title: 'Bob Johnson', type: 'private' as const, telegramChannelId: 100002 },
  {
    chatId: 'chat-8',
    title: 'Book Club',
    type: 'group' as const,
    telegramChannelId: -1001234567895,
  },
  // Korean chats
  {
    chatId: 'chat-kr-1',
    title: '개발자 커뮤니티',
    type: 'supergroup' as const,
    telegramChannelId: -1001234567896,
  },
  {
    chatId: 'chat-kr-2',
    title: '한국 스타트업 네트워크',
    type: 'channel' as const,
    telegramChannelId: -1001234567897,
  },
  {
    chatId: 'chat-kr-3',
    title: '가족 모임',
    type: 'group' as const,
    telegramChannelId: -1001234567898,
  },
  { chatId: 'chat-kr-4', title: '김민수', type: 'private' as const, telegramChannelId: 100003 },
]

// Sample messages
export const DEV_MESSAGES = [
  {
    id: 'msg-001',
    user_id: 'dev-user-001',
    telegram_message_id: 1001,
    content:
      'Just deployed the new version of our app! The dark mode looks absolutely stunning. Really proud of what the team accomplished this sprint.',
    sender_id: 100001,
    sender_name: 'Sarah Chen',
    chat_id: 'chat-1',
    chat_title: 'Tech News Channel',
    chat_type: 'channel',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 min ago
    message_type: 'text',
    has_media: false,
    is_reply: false,
    is_forward: false,
    fetched_at: new Date().toISOString(),
  },
  {
    id: 'msg-002',
    user_id: 'dev-user-001',
    telegram_message_id: 1002,
    content:
      "Has anyone tried the new AI coding assistant? It's been a game changer for my productivity. Wrote a complete REST API in under 2 hours!",
    sender_id: 100002,
    sender_name: 'Mike Rodriguez',
    chat_id: 'chat-2',
    chat_title: 'Startup Founders',
    chat_type: 'supergroup',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 min ago
    message_type: 'text',
    has_media: false,
    is_reply: false,
    is_forward: false,
    fetched_at: new Date().toISOString(),
  },
  {
    id: 'msg-003',
    user_id: 'dev-user-001',
    telegram_message_id: 1003,
    content: "Happy birthday Mom! 🎂 Hope you have an amazing day! We'll video call later tonight.",
    sender_id: 100003,
    sender_name: 'You',
    chat_id: 'chat-3',
    chat_title: 'Family Group',
    chat_type: 'group',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
    message_type: 'text',
    has_media: false,
    is_reply: false,
    is_forward: false,
    fetched_at: new Date().toISOString(),
  },
  {
    id: 'msg-004',
    user_id: 'dev-user-001',
    telegram_message_id: 1004,
    content: 'Check out this design mockup I created for the new landing page!',
    sender_id: 100004,
    sender_name: 'Alice Smith',
    chat_id: 'chat-4',
    chat_title: 'Alice Smith',
    chat_type: 'private',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 min ago
    message_type: 'photo',
    has_media: true,
    file_name: 'landing-mockup.png',
    file_size: 2048000,
    file_mime_type: 'image/png',
    file_width: 1920,
    file_height: 1080,
    is_reply: false,
    is_forward: false,
    fetched_at: new Date().toISOString(),
  },
  {
    id: 'msg-005',
    user_id: 'dev-user-001',
    telegram_message_id: 1005,
    content:
      '📈 BTC breaking resistance at $45k. Next target $48k. This could be the start of the next bull run. NFA.',
    sender_id: 100005,
    sender_name: 'CryptoAnalyst',
    chat_id: 'chat-5',
    chat_title: 'Crypto Signals',
    chat_type: 'channel',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
    message_type: 'text',
    has_media: false,
    is_reply: false,
    is_forward: true,
    fetched_at: new Date().toISOString(),
  },
  {
    id: 'msg-006',
    user_id: 'dev-user-001',
    telegram_message_id: 1006,
    content:
      "Team, please review the Q4 planning document before tomorrow's standup. Link: docs.google.com/...",
    sender_id: 100006,
    sender_name: 'Project Manager',
    chat_id: 'chat-6',
    chat_title: 'Work Team',
    chat_type: 'supergroup',
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(), // 1.5 hours ago
    message_type: 'text',
    has_media: false,
    is_reply: false,
    is_forward: false,
    fetched_at: new Date().toISOString(),
  },
  {
    id: 'msg-007',
    user_id: 'dev-user-001',
    telegram_message_id: 1007,
    content: 'Hey! Are we still on for coffee tomorrow at 3pm?',
    sender_id: 100007,
    sender_name: 'Bob Johnson',
    chat_id: 'chat-7',
    chat_title: 'Bob Johnson',
    chat_type: 'private',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    message_type: 'text',
    has_media: false,
    is_reply: false,
    is_forward: false,
    fetched_at: new Date().toISOString(),
  },
  {
    id: 'msg-008',
    user_id: 'dev-user-001',
    telegram_message_id: 1008,
    content:
      'Just finished "The Midnight Library" - what an incredible read! Anyone else read it? The concept of parallel lives is fascinating.',
    sender_id: 100008,
    sender_name: 'Emma Watson',
    chat_id: 'chat-8',
    chat_title: 'Book Club',
    chat_type: 'group',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hours ago
    message_type: 'text',
    has_media: false,
    is_reply: false,
    is_forward: false,
    fetched_at: new Date().toISOString(),
  },
  {
    id: 'msg-009',
    user_id: 'dev-user-001',
    telegram_message_id: 1009,
    content: "Recording from today's webinar on React performance optimization",
    sender_id: 100001,
    sender_name: 'Sarah Chen',
    chat_id: 'chat-1',
    chat_title: 'Tech News Channel',
    chat_type: 'channel',
    timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(), // 4 hours ago
    message_type: 'video',
    has_media: true,
    file_name: 'react-perf-webinar.mp4',
    file_size: 150000000,
    file_mime_type: 'video/mp4',
    file_duration: 3600,
    is_reply: false,
    is_forward: false,
    fetched_at: new Date().toISOString(),
  },
  {
    id: 'msg-010',
    user_id: 'dev-user-001',
    telegram_message_id: 1010,
    content:
      "Replying to your question about the API rate limits - we've increased them to 1000 req/min for premium users.",
    sender_id: 100002,
    sender_name: 'Mike Rodriguez',
    chat_id: 'chat-2',
    chat_title: 'Startup Founders',
    chat_type: 'supergroup',
    timestamp: new Date(Date.now() - 1000 * 60 * 300).toISOString(), // 5 hours ago
    message_type: 'text',
    has_media: false,
    is_reply: true,
    is_forward: false,
    fetched_at: new Date().toISOString(),
  },
  {
    id: 'msg-011',
    user_id: 'dev-user-001',
    telegram_message_id: 1011,
    content: "Here's the project proposal document we discussed earlier.",
    sender_id: 100006,
    sender_name: 'Project Manager',
    chat_id: 'chat-6',
    chat_title: 'Work Team',
    chat_type: 'supergroup',
    timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(), // 6 hours ago
    message_type: 'document',
    has_media: true,
    file_name: 'Q4-Project-Proposal.pdf',
    file_size: 5242880,
    file_mime_type: 'application/pdf',
    is_reply: false,
    is_forward: false,
    fetched_at: new Date().toISOString(),
  },
  {
    id: 'msg-012',
    user_id: 'dev-user-001',
    telegram_message_id: 1012,
    content:
      'The TypeScript 5.3 release notes are out! Pattern matching is finally here. This is huge for functional programming enthusiasts.',
    sender_id: 100001,
    sender_name: 'Sarah Chen',
    chat_id: 'chat-1',
    chat_title: 'Tech News Channel',
    chat_type: 'channel',
    timestamp: new Date(Date.now() - 1000 * 60 * 420).toISOString(), // 7 hours ago
    message_type: 'text',
    has_media: false,
    is_reply: false,
    is_forward: true,
    fetched_at: new Date().toISOString(),
  },
  {
    id: 'msg-013',
    user_id: 'dev-user-001',
    telegram_message_id: 1013,
    content: 'Voice message from the team sync',
    sender_id: 100006,
    sender_name: 'Project Manager',
    chat_id: 'chat-6',
    chat_title: 'Work Team',
    chat_type: 'supergroup',
    timestamp: new Date(Date.now() - 1000 * 60 * 480).toISOString(), // 8 hours ago
    message_type: 'voice',
    has_media: true,
    file_size: 256000,
    file_mime_type: 'audio/ogg',
    file_duration: 45,
    is_reply: false,
    is_forward: false,
    fetched_at: new Date().toISOString(),
  },
  {
    id: 'msg-014',
    user_id: 'dev-user-001',
    telegram_message_id: 1014,
    content: "Looking forward to the weekend hiking trip! Here's the trail map.",
    sender_id: 100004,
    sender_name: 'Alice Smith',
    chat_id: 'chat-4',
    chat_title: 'Alice Smith',
    chat_type: 'private',
    timestamp: new Date(Date.now() - 1000 * 60 * 540).toISOString(), // 9 hours ago
    message_type: 'photo',
    has_media: true,
    file_name: 'trail-map.jpg',
    file_size: 1024000,
    file_mime_type: 'image/jpeg',
    file_width: 1200,
    file_height: 800,
    is_reply: false,
    is_forward: false,
    fetched_at: new Date().toISOString(),
  },
  {
    id: 'msg-015',
    user_id: 'dev-user-001',
    telegram_message_id: 1015,
    content:
      "Don't forget: weekly book discussion is at 7pm tonight! We're covering chapters 10-15.",
    sender_id: 100008,
    sender_name: 'Emma Watson',
    chat_id: 'chat-8',
    chat_title: 'Book Club',
    chat_type: 'group',
    timestamp: new Date(Date.now() - 1000 * 60 * 600).toISOString(), // 10 hours ago
    message_type: 'text',
    has_media: false,
    is_reply: false,
    is_forward: false,
    fetched_at: new Date().toISOString(),
  },
  // Korean messages
  {
    id: 'msg-kr-001',
    user_id: 'dev-user-001',
    telegram_message_id: 2001,
    content:
      '오늘 React 19 정식 출시됐습니다! 서버 컴포넌트가 드디어 안정화되었네요. 성능 개선도 엄청나고, 특히 Suspense 관련 업데이트가 인상적입니다.',
    sender_id: 200001,
    sender_name: '박지현',
    chat_id: 'chat-kr-1',
    chat_title: '개발자 커뮤니티',
    chat_type: 'supergroup',
    timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(), // 3 min ago
    message_type: 'text',
    has_media: false,
    is_reply: false,
    is_forward: false,
    fetched_at: new Date().toISOString(),
  },
  {
    id: 'msg-kr-002',
    user_id: 'dev-user-001',
    telegram_message_id: 2002,
    content:
      '새로운 AI 스타트업 투자 유치 소식입니다. 시드 라운드에서 50억원 투자 받았습니다. 한국 AI 생태계가 점점 성장하고 있네요! 🚀',
    sender_id: 200002,
    sender_name: '이승호',
    chat_id: 'chat-kr-2',
    chat_title: '한국 스타트업 네트워크',
    chat_type: 'channel',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(), // 12 min ago
    message_type: 'text',
    has_media: false,
    is_reply: false,
    is_forward: false,
    fetched_at: new Date().toISOString(),
  },
  {
    id: 'msg-kr-003',
    user_id: 'dev-user-001',
    telegram_message_id: 2003,
    content:
      '엄마 생신 축하드려요! 🎂🎉 건강하시고 항상 행복하세요. 저녁에 온 가족이 모여서 파티할게요!',
    sender_id: 200003,
    sender_name: '나',
    chat_id: 'chat-kr-3',
    chat_title: '가족 모임',
    chat_type: 'group',
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(), // 25 min ago
    message_type: 'text',
    has_media: false,
    is_reply: false,
    is_forward: false,
    fetched_at: new Date().toISOString(),
  },
  {
    id: 'msg-kr-004',
    user_id: 'dev-user-001',
    telegram_message_id: 2004,
    content: '이번 주말에 북한산 등산 어때요? 날씨가 좋다고 하는데, 같이 가실 분 계신가요?',
    sender_id: 200004,
    sender_name: '김민수',
    chat_id: 'chat-kr-4',
    chat_title: '김민수',
    chat_type: 'private',
    timestamp: new Date(Date.now() - 1000 * 60 * 40).toISOString(), // 40 min ago
    message_type: 'text',
    has_media: false,
    is_reply: false,
    is_forward: false,
    fetched_at: new Date().toISOString(),
  },
  {
    id: 'msg-kr-005',
    user_id: 'dev-user-001',
    telegram_message_id: 2005,
    content:
      'TypeScript 5.4 버전에서 추가된 NoInfer 유틸리티 타입 정말 유용하네요. 제네릭 타입 추론할 때 훨씬 깔끔해졌습니다. 코드 예제 공유합니다.',
    sender_id: 200001,
    sender_name: '박지현',
    chat_id: 'chat-kr-1',
    chat_title: '개발자 커뮤니티',
    chat_type: 'supergroup',
    timestamp: new Date(Date.now() - 1000 * 60 * 55).toISOString(), // 55 min ago
    message_type: 'document',
    has_media: true,
    file_name: 'typescript-tips.pdf',
    file_size: 1048576,
    file_mime_type: 'application/pdf',
    is_reply: false,
    is_forward: false,
    fetched_at: new Date().toISOString(),
  },
  {
    id: 'msg-kr-006',
    user_id: 'dev-user-001',
    telegram_message_id: 2006,
    content:
      '한국 개발자 컨퍼런스 일정 공유합니다. FEConf 2024가 다음 달 15일에 열립니다. 올해는 오프라인으로 진행된다고 하네요!',
    sender_id: 200005,
    sender_name: '최유진',
    chat_id: 'chat-kr-1',
    chat_title: '개발자 커뮤니티',
    chat_type: 'supergroup',
    timestamp: new Date(Date.now() - 1000 * 60 * 70).toISOString(), // 70 min ago
    message_type: 'text',
    has_media: false,
    is_reply: false,
    is_forward: true,
    fetched_at: new Date().toISOString(),
  },
  {
    id: 'msg-kr-007',
    user_id: 'dev-user-001',
    telegram_message_id: 2007,
    content:
      '제가 만든 사이드 프로젝트 데모 영상입니다. AI 기반 일정 관리 앱인데, 피드백 부탁드려요!',
    sender_id: 200002,
    sender_name: '이승호',
    chat_id: 'chat-kr-2',
    chat_title: '한국 스타트업 네트워크',
    chat_type: 'channel',
    timestamp: new Date(Date.now() - 1000 * 60 * 100).toISOString(), // 100 min ago
    message_type: 'video',
    has_media: true,
    file_name: 'ai-scheduler-demo.mp4',
    file_size: 45000000,
    file_mime_type: 'video/mp4',
    file_duration: 180,
    is_reply: false,
    is_forward: false,
    fetched_at: new Date().toISOString(),
  },
  {
    id: 'msg-kr-008',
    user_id: 'dev-user-001',
    telegram_message_id: 2008,
    content: '주말에 찍은 가족 사진이에요. 할머니 댁에서 다 같이 모였는데 정말 즐거웠어요! 😊',
    sender_id: 200006,
    sender_name: '동생',
    chat_id: 'chat-kr-3',
    chat_title: '가족 모임',
    chat_type: 'group',
    timestamp: new Date(Date.now() - 1000 * 60 * 150).toISOString(), // 2.5 hours ago
    message_type: 'photo',
    has_media: true,
    file_name: 'family-photo.jpg',
    file_size: 3500000,
    file_mime_type: 'image/jpeg',
    file_width: 4032,
    file_height: 3024,
    is_reply: false,
    is_forward: false,
    fetched_at: new Date().toISOString(),
  },
  {
    id: 'msg-kr-009',
    user_id: 'dev-user-001',
    telegram_message_id: 2009,
    content:
      '요즘 읽고 있는 책 추천해요. "클린 아키텍처"인데, 소프트웨어 설계에 대한 통찰이 정말 좋습니다. 개발자라면 꼭 읽어보세요!',
    sender_id: 200004,
    sender_name: '김민수',
    chat_id: 'chat-kr-4',
    chat_title: '김민수',
    chat_type: 'private',
    timestamp: new Date(Date.now() - 1000 * 60 * 200).toISOString(), // 3+ hours ago
    message_type: 'text',
    has_media: false,
    is_reply: true,
    is_forward: false,
    fetched_at: new Date().toISOString(),
  },
  {
    id: 'msg-kr-010',
    user_id: 'dev-user-001',
    telegram_message_id: 2010,
    content:
      'Next.js 15 마이그레이션 가이드 작성했습니다. App Router 전환 시 주의할 점들 정리했으니 참고하세요. 특히 캐싱 관련 변경사항이 중요합니다.',
    sender_id: 200005,
    sender_name: '최유진',
    chat_id: 'chat-kr-1',
    chat_title: '개발자 커뮤니티',
    chat_type: 'supergroup',
    timestamp: new Date(Date.now() - 1000 * 60 * 250).toISOString(), // 4+ hours ago
    message_type: 'text',
    has_media: false,
    is_reply: false,
    is_forward: false,
    fetched_at: new Date().toISOString(),
  },
  // Long-form structured market analysis message (exact format match)
  {
    id: 'msg-market-analysis-001',
    user_id: 'dev-user-001',
    telegram_message_id: 3001,
    content: `📊 Market View (베네수엘라 관련)
- 초기 지정학적 충격은 해소되었으며, 시장은 '미국 주도의 질서 회복'과 '원유 공급 과잉(Glut)'에 주목하고 있습니다.
- 막연한 고유가 베팅을 멈추고, [정제 마진 확대 + 재건 인프라 + 법적 회수]로 이어지는 실질 수혜주로 압축 대응해야 합니다.

💡 Top Picks (Long Strategy)

1) US Refiners (구조적 수혜)
- 티커: $VLO (Valero), $PSX (Phillips 66)
- 논거: 베네수엘라산 중질유(Heavy Sour) 유입 재개 시 정제 마진(Crack Spread) 폭발적 개선. 캐나다산 원유 대체 효과로 원가 경쟁력 확보.

2) Reconstruction & Security (재건/보안)
- 티커: $CVX (Chevron), $SLB (SLB), $AVAV (AeroVironment)
- 논거: CVX는 현지 유일 메이저로 즉각 증산 가능. SLB는 노후 인프라 복구 필수 파트너. AVAV는 정글 지형 감시 및 국경 통제용 드론 수요 급증.

3) Special Situations (회복 가치)
- 티커: 베네수엘라 국채 (Sovereign/PDVSA), $GRZ.V (Gold Reserve)
- 논거: 국채 가격 40센트 돌파(회수율 60% 기대). Gold Reserve는 친미 정권 수립 시 금광 채굴권 회복 또는 배상금 수혜 1순위.

⚠️ Risk / Short (매도/비중 축소)
- 티커: $CNQ (Canadian Natural Resources) 및 캐나다 오일샌드
- 논거: 베네수엘라 원유가 멕시코만으로 들어오면 유사 성상인 캐나다산(WCS)의 가격 경쟁력 하락 불가피. 디스카운트 확대 우려.

🛡️ Hedging Strategy (테일 리스크)
- 자산: 금($GLD), 방산 ETF($ITA), 사이버보안($CIBR)
- 시나리오: 중국의 비대칭 보복(사이버 공격, 호르무즈 통제) 및 잔존 세력의 게릴라전 장기화 대비. '달러 패권' 강화 속에서도 지정학적 불확실성의 최후 보루인 비중 유지.

📝 결론
- 베네수엘라는 다시 '비즈니스의 영역'으로 돌아왔습니다.
- 감정적 대응을 배제하고, 철저히 미국의 국익(에너지 안보)과 일치하는 섹터에 집중하는것도 방법입니다`,
    sender_id: 200010,
    sender_name: '글로벌마켓 리서치',
    chat_id: 'chat-kr-2',
    chat_title: '한국 스타트업 네트워크',
    chat_type: 'channel',
    timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(), // 8 min ago
    message_type: 'text',
    has_media: false,
    is_reply: false,
    is_forward: true,
    fetched_at: new Date().toISOString(),
  },
  // Another long technical analysis message
  {
    id: 'msg-tech-analysis-001',
    user_id: 'dev-user-001',
    telegram_message_id: 3002,
    content: `🚀 **React 19 Major Release Analysis**

**새로운 주요 기능들:**

**1. Server Components (안정화)**
- RSC(React Server Components) 정식 지원
- 클라이언트 번들 크기 대폭 감소
- SEO 및 초기 로딩 속도 개선
- Next.js 15와 완벽 호환

**2. Concurrent Features**
- useTransition 성능 최적화
- Suspense 경계에서의 에러 처리 개선
- Streaming SSR 향상된 안정성
- Time Slicing 알고리즘 개선

**3. 개발자 경험 향상**
- React DevTools 새로운 프로파일러
- 향상된 에러 메시지와 스택 추적
- TypeScript 5.4 완전 지원
- ESLint 규칙 업데이트

**마이그레이션 가이드:**

**Breaking Changes:**
- React.FC 타입 정의 변경
- useEffect cleanup 함수 동작 수정
- StrictMode에서 더 엄격한 검사

**호환성:**
- Node.js 18.17+ 필수
- TypeScript 5.0+ 권장
- Webpack 5+ 필요

**성능 벤치마크:**
- 번들 크기: 평균 23% 감소
- 렌더링 성능: 18% 향상
- 메모리 사용량: 15% 최적화

프로덕션 적용 전 충분한 테스트 필수! 🧪`,
    sender_id: 200011,
    sender_name: '테크리드',
    chat_id: 'chat-kr-1',
    chat_title: '개발자 커뮤니티',
    chat_type: 'supergroup',
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(), // 18 min ago
    message_type: 'text',
    has_media: false,
    is_reply: false,
    is_forward: false,
    fetched_at: new Date().toISOString(),
  },
  // INTERNATIONAL TEST MESSAGES
  // Arabic numbered list (RTL test)
  {
    id: 'msg-arabic-001',
    user_id: 'dev-user-001',
    telegram_message_id: 4001,
    content: `1) البند الأول من القائمة
2) البند الثاني من القائمة
3) البند الثالث من القائمة
4) البند الرابع من القائمة`,
    sender_id: 300001,
    sender_name: 'محمد علي',
    chat_id: 'chat-1',
    chat_title: 'Tech News Channel',
    chat_type: 'channel',
    timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    message_type: 'text',
    has_media: false,
    is_reply: false,
    is_forward: false,
    fetched_at: new Date().toISOString(),
  },
  // Arabic with diacritics
  {
    id: 'msg-arabic-002',
    user_id: 'dev-user-001',
    telegram_message_id: 4002,
    content: `1) مَرْحَباً بِكُمْ فِي الْقَائِمَةِ
2) هَذَا الْبَنْدُ الثَّانِي مِنَ الْقَائِمَةِ
3) الْبَنْدُ الثَّالِثُ يَحْتَوِي عَلَى نَصٍّ طَوِيلٍ`,
    sender_id: 300001,
    sender_name: 'محمد علي',
    chat_id: 'chat-1',
    chat_title: 'Tech News Channel',
    chat_type: 'channel',
    timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    message_type: 'text',
    has_media: false,
    is_reply: false,
    is_forward: false,
    fetched_at: new Date().toISOString(),
  },
  // Long Arabic text without spaces (wrapping test)
  {
    id: 'msg-arabic-003',
    user_id: 'dev-user-001',
    telegram_message_id: 4003,
    content: `تحليل السوق والاتجاهات الاقتصادية الحالية يشير إلى أن الاستثمارات في قطاع التكنولوجيا ستشهد نموا ملحوظا خلال السنوات القادمة وهذا يعكس الاهتمام المتزايد بالتحول الرقمي والابتكار التكنولوجي في جميع القطاعات الصناعية`,
    sender_id: 300001,
    sender_name: 'محمد علي',
    chat_id: 'chat-1',
    chat_title: 'Tech News Channel',
    chat_type: 'channel',
    timestamp: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
    message_type: 'text',
    has_media: false,
    is_reply: false,
    is_forward: false,
    fetched_at: new Date().toISOString(),
  },
  // Chinese simplified numbered list
  {
    id: 'msg-chinese-001',
    user_id: 'dev-user-001',
    telegram_message_id: 4004,
    content: `1) 第一项是关于系统架构的描述
2) 第二项涵盖了数据库设计的内容
3) 第三项讨论了前端框架的选择
4) 第四项探讨了部署策略和最佳实践`,
    sender_id: 300002,
    sender_name: '王小明',
    chat_id: 'chat-2',
    chat_title: 'Startup Founders',
    chat_type: 'supergroup',
    timestamp: new Date(Date.now() - 1000 * 60 * 7).toISOString(),
    message_type: 'text',
    has_media: false,
    is_reply: false,
    is_forward: false,
    fetched_at: new Date().toISOString(),
  },
  // Chinese traditional numbered list
  {
    id: 'msg-chinese-002',
    user_id: 'dev-user-001',
    telegram_message_id: 4005,
    content: `1) 這是關於開發環境設定的首個項目
2) 第二個項目涵蓋了測試框架的配置方式
3) 第三個項目討論安全性和加密的實踐方法
4) 最後一個項目說明部署流程和監控設置`,
    sender_id: 300002,
    sender_name: '王小明',
    chat_id: 'chat-2',
    chat_title: 'Startup Founders',
    chat_type: 'supergroup',
    timestamp: new Date(Date.now() - 1000 * 60 * 9).toISOString(),
    message_type: 'text',
    has_media: false,
    is_reply: false,
    is_forward: false,
    fetched_at: new Date().toISOString(),
  },
  // Long Chinese text without spaces (wrapping test)
  {
    id: 'msg-chinese-003',
    user_id: 'dev-user-001',
    telegram_message_id: 4006,
    content: `我们的分析表明中文文本处理面临的主要挑战包括无空格分词正确的换行位置判断和在不同屏幕尺寸上的适应性这些问题要求特殊的CSS和JavaScript处理来确保文本在移动设备上能够正确显示和保持可读性`,
    sender_id: 300002,
    sender_name: '王小明',
    chat_id: 'chat-2',
    chat_title: 'Startup Founders',
    chat_type: 'supergroup',
    timestamp: new Date(Date.now() - 1000 * 60 * 11).toISOString(),
    message_type: 'text',
    has_media: false,
    is_reply: false,
    is_forward: false,
    fetched_at: new Date().toISOString(),
  },
  // Japanese numbered list with mixed scripts
  {
    id: 'msg-japanese-001',
    user_id: 'dev-user-001',
    telegram_message_id: 4007,
    content: `1) 最初の項目は開発環境のセットアップに関するものです
2) 二番目の項目ではテストフレームワークについて説明します
3) 三番目の項目は本番環境へのデプロイメント手順です
4) 最後の項目は監視とロギングの設定方法です`,
    sender_id: 300003,
    sender_name: '田中太郎',
    chat_id: 'chat-2',
    chat_title: 'Startup Founders',
    chat_type: 'supergroup',
    timestamp: new Date(Date.now() - 1000 * 60 * 13).toISOString(),
    message_type: 'text',
    has_media: false,
    is_reply: false,
    is_forward: false,
    fetched_at: new Date().toISOString(),
  },
  // Russian Cyrillic numbered list
  {
    id: 'msg-russian-001',
    user_id: 'dev-user-001',
    telegram_message_id: 4008,
    content: `1) Первый пункт содержит информацию о системной архитектуре
2) Второй пункт описывает процесс аутентификации и авторизации
3) Третий пункт охватывает интеграцию с внешними сервисами
4) Четвёртый пункт излагает стратегию развёртывания в продакшене`,
    sender_id: 300004,
    sender_name: 'Иван Петров',
    chat_id: 'chat-6',
    chat_title: 'Work Team',
    chat_type: 'supergroup',
    timestamp: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
    message_type: 'text',
    has_media: false,
    is_reply: false,
    is_forward: false,
    fetched_at: new Date().toISOString(),
  },
  // Hebrew numbered list (RTL test)
  {
    id: 'msg-hebrew-001',
    user_id: 'dev-user-001',
    telegram_message_id: 4009,
    content: `1) הפריט הראשון עוסק בארכיטקטורת המערכת
2) הפריט השני מתאר את תהליך ההתחברות וההרשאה
3) הפריט השלישי כולל אינטגרציה עם שירותים חיצוניים
4) הפריט הרביעי מפרט את אסטרטגיית ההפעלה בייצור`,
    sender_id: 300005,
    sender_name: 'דוד כהן',
    chat_id: 'chat-6',
    chat_title: 'Work Team',
    chat_type: 'supergroup',
    timestamp: new Date(Date.now() - 1000 * 60 * 16).toISOString(),
    message_type: 'text',
    has_media: false,
    is_reply: false,
    is_forward: false,
    fetched_at: new Date().toISOString(),
  },
  // Mixed scripts in single line
  {
    id: 'msg-mixed-001',
    user_id: 'dev-user-001',
    telegram_message_id: 4010,
    content: `The market analysis (تحليل السوق) shows strong growth in Korea (한국에서의 성장) over the past quarter`,
    sender_id: 300006,
    sender_name: 'Global Analyst',
    chat_id: 'chat-5',
    chat_title: 'Crypto Signals',
    chat_type: 'channel',
    timestamp: new Date(Date.now() - 1000 * 60 * 17).toISOString(),
    message_type: 'text',
    has_media: false,
    is_reply: false,
    is_forward: false,
    fetched_at: new Date().toISOString(),
  },
  // Thai text with complex characters
  {
    id: 'msg-thai-001',
    user_id: 'dev-user-001',
    telegram_message_id: 4011,
    content: `การวิเคราะห์ข้อมูลทางการเงินแสดงให้เห็นว่าการลงทุนในภาคเทคโนโลยีจะเพิ่มขึ้นอย่างมีนัยสำคัญในช่วงปีข้างหน้า`,
    sender_id: 300007,
    sender_name: 'สมชาย วงศ์ใหญ่',
    chat_id: 'chat-5',
    chat_title: 'Crypto Signals',
    chat_type: 'channel',
    timestamp: new Date(Date.now() - 1000 * 60 * 19).toISOString(),
    message_type: 'text',
    has_media: false,
    is_reply: false,
    is_forward: false,
    fetched_at: new Date().toISOString(),
  },
  // Emoji sequences with ZWJ
  {
    id: 'msg-emoji-001',
    user_id: 'dev-user-001',
    telegram_message_id: 4012,
    content: `Family emoji: 👨‍👩‍👧‍👦 (man + ZWJ + woman + ZWJ + girl + ZWJ + boy)
Waving hand with skin tone: 👋🏽 (waving hand + light skin tone modifier)
Mixed: 👍🏼 🎉 ❤️ 🚀 ✨`,
    sender_id: 100001,
    sender_name: 'Sarah Chen',
    chat_id: 'chat-1',
    chat_title: 'Tech News Channel',
    chat_type: 'channel',
    timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    message_type: 'text',
    has_media: false,
    is_reply: false,
    is_forward: false,
    fetched_at: new Date().toISOString(),
  },
  // Complex Arabic market analysis with RTL
  {
    id: 'msg-arabic-market-001',
    user_id: 'dev-user-001',
    telegram_message_id: 4013,
    content: `تقرير السوق اليومي
================

سعر السهم:
1) شركة الاتصالات السعودية (STC): 75.50 ريال سعودي (↑2.3%)
2) بنك الراجحي: 182.30 ريال سعودي (↑1.8%)
3) أرامكو السعودية: 38.15 ريال سعودي (↓0.5%)

التحليل:
شهدت الأسواق المالية الخليجية ارتفاعاً ملحوظاً خلال الأسبوع الماضي، مع تركيز الاستثمارات على قطاع البنوك والتكنولوجيا. يتوقع المحللون مزيداً من النمو في الفترة القادمة.`,
    sender_id: 300001,
    sender_name: 'محمد علي',
    chat_id: 'chat-5',
    chat_title: 'Crypto Signals',
    chat_type: 'channel',
    timestamp: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
    message_type: 'text',
    has_media: false,
    is_reply: false,
    is_forward: false,
    fetched_at: new Date().toISOString(),
  },
  // Chinese technical documentation
  {
    id: 'msg-chinese-tech-001',
    user_id: 'dev-user-001',
    telegram_message_id: 4014,
    content: `系统架构文档
============

核心组件：
1) 消息队列服务 - 处理异步消息传递
2) 缓存层 - 使用Redis缓存热点数据
3) 数据库连接池 - PostgreSQL连接管理
4) API网关 - 请求路由和认证

关键要点：
- 确保所有数据库连接都经过连接池
- 实现适当的错误处理和重试机制
- 监控缓存命中率以优化性能`,
    sender_id: 300002,
    sender_name: '王小明',
    chat_id: 'chat-kr-1',
    chat_title: '개발자 커뮤니티',
    chat_type: 'supergroup',
    timestamp: new Date(Date.now() - 1000 * 60 * 24).toISOString(),
    message_type: 'text',
    has_media: false,
    is_reply: false,
    is_forward: false,
    fetched_at: new Date().toISOString(),
  },
  // Bidirectional text mixing
  {
    id: 'msg-bidi-001',
    user_id: 'dev-user-001',
    telegram_message_id: 4015,
    content: `The Hebrew word "שלום" means peace.
En français: "Bonjour" (مرحبا in Arabic) is hello.
Mixed content: 你好 (Chinese), こんにちは (Japanese), 안녕하세요 (Korean)`,
    sender_id: 300006,
    sender_name: 'Global Analyst',
    chat_id: 'chat-8',
    chat_title: 'Book Club',
    chat_type: 'group',
    timestamp: new Date(Date.now() - 1000 * 60 * 26).toISOString(),
    message_type: 'text',
    has_media: false,
    is_reply: false,
    is_forward: false,
    fetched_at: new Date().toISOString(),
  },
  // Contact information in multiple languages
  {
    id: 'msg-contact-001',
    user_id: 'dev-user-001',
    telegram_message_id: 4016,
    content: `Contact Information
===================

Korean Office:
1) Name: 김민수
2) Phone: +82-10-1234-5678
3) Email: kim@example.kr

Saudi Office:
1) Name: محمد علي
2) Phone: +966-50-1234567
3) Email: mohammad@example.sa

Russian Office:
1) Name: Иван Петров
2) Phone: +7-999-123-4567
3) Email: ivan@example.ru

Important Dates:
- Launch date: 2026-01-16
- Deadline: 15/01/2026 (DD/MM/YYYY format)
- Meeting: 16 janvier 2026 (French format)`,
    sender_id: 100006,
    sender_name: 'Project Manager',
    chat_id: 'chat-6',
    chat_title: 'Work Team',
    chat_type: 'supergroup',
    timestamp: new Date(Date.now() - 1000 * 60 * 28).toISOString(),
    message_type: 'text',
    has_media: false,
    is_reply: false,
    is_forward: false,
    fetched_at: new Date().toISOString(),
  },
  // Detailed startup funding analysis
  {
    id: 'msg-startup-funding-001',
    user_id: 'dev-user-001',
    telegram_message_id: 3003,
    content: `💼 **한국 스타트업 투자 동향 Q4 2024**

**주요 트렌드 분석:**

**🔥 핫섹터 TOP 3:**

**1. AI/ML 스타트업**
- 총 투자액: 2,847억원 (전년대비 156% 증가)
- 주요 딜: 업스테이지 시리즈C 720억원
- 유니콘 후보: 스캐터랩, 루닛, 수아랩

**2. 핀테크/DeFi**
- 총 투자액: 1,923억원 (전년대비 89% 증가)
- 주요 딜: 던앤브래드스트리트코리아 580억원
- 주목 기업: 토스, 카카오뱅크, 센드버드

**3. 클린테크/ESG**
- 총 투자액: 1,456억원 (신규 섹터)
- 주요 딜: SK E&S 그린수소 450억원
- 성장 동력: 탄소중립 정책, RE100 확산

**투자자별 활동:**

**💰 VC 펀드 현황:**
- 신규 결성: 18개 펀드, 총 8,920억원
- 활발한 GP: 캡스톤파트너스, 소프트뱅크벤처스
- 기업 CVC: 삼성벤처스, LG테크놀로지벤처스

**🌏 해외 진출:**
- 실리콘밸리 진출: 27개 회사
- 동남아시아 확장: 156개 회사
- 글로벌 IPO 준비: 크래프톤, 컬리

**예측 및 전망:**

**2025년 주목 분야:**
- 🤖 로보틱스 자동화
- 🧬 바이오테크 혁신
- 🌐 Web3/블록체인 실용화
- 🚗 자율주행 상용화

**리스크 요인:**
- 금리 인상 지속
- 글로벌 경기 둔화
- 규제 환경 변화

상세한 섹터별 분석 자료는 첨부 파일 참조! 📊`,
    sender_id: 200012,
    sender_name: '벤처캐피탈 인사이트',
    chat_id: 'chat-kr-2',
    chat_title: '한국 스타트업 네트워크',
    chat_type: 'channel',
    timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(), // 35 min ago
    message_type: 'text',
    has_media: false,
    is_reply: false,
    is_forward: false,
    fetched_at: new Date().toISOString(),
  },
]

/**
 * Check if a phone number is the dev mode phone number
 */
export function isDevPhoneNumber(phoneNumber: string): boolean {
  return phoneNumber === DEV_PHONE_NUMBER
}

/**
 * Check if a token is the dev mode token
 */
export function isDevToken(token: string | null): boolean {
  return token === DEV_TOKEN
}

/**
 * Filter and paginate dev messages
 */
export function getDevMessages(params: {
  offset?: number
  limit?: number
  search?: string
  chatIds?: string[]
}) {
  let filtered = [...DEV_MESSAGES]

  // Apply search filter
  if (params.search) {
    const searchLower = params.search.toLowerCase()
    filtered = filtered.filter(
      (msg) =>
        msg.content?.toLowerCase().includes(searchLower) ||
        msg.sender_name.toLowerCase().includes(searchLower) ||
        msg.chat_title.toLowerCase().includes(searchLower)
    )
  }

  // Apply chat filter (supports multiple chat IDs)
  if (params.chatIds && params.chatIds.length > 0) {
    filtered = filtered.filter((msg) => params.chatIds!.includes(msg.chat_id))
  }

  // Sort by timestamp (newest first)
  filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  // Apply pagination
  const offset = params.offset || 0
  const limit = params.limit || 50
  const paginated = filtered.slice(offset, offset + limit)

  return {
    messages: paginated,
    total: filtered.length,
    offset,
    limit,
    has_more: offset + paginated.length < filtered.length,
  }
}
