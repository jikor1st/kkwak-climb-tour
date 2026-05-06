/**
 * 카카오톡 인앱 브라우저(웹뷰) 환경인지 판별.
 * OG 태그 수집용 카카오톡 스크래퍼 봇(kakaotalk-scrap)은 제외해서, 카톡 채팅에
 * 링크 붙여넣을 때 미리보기는 정상 동작하도록 한다.
 */
export function getIsKakaoTalkWebview(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false
  const isKakao = /KAKAOTALK/i.test(userAgent)
  const isScraper = /kakaotalk-scrap/i.test(userAgent)
  return isKakao && !isScraper
}
