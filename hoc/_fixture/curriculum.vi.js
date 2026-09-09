// Development fixture only, never shipped as page content.
//
// player.js loads this ONLY when ../data/curriculum.vi.js has not been loaded — so the player
// can be built and driven before the real curriculum index exists. Shape follows PLAN.md C4.
// `fixture: true` is what tells the loader to look in this folder for lesson JSON first, so a
// fixture session never fires a 404 at data/lessons/vi/.
window.TypingEaseCurriculum = window.TypingEaseCurriculum || {
  lang: 'vi',
  fixture: true,
  units: [
    {
      id: 'u1',
      title: 'Hàng phím cơ sở',
      summary: 'Fixture: một bài mẫu với đủ năm loại screen.',
      groups: [{ id: 'bat-dau', title: 'Bắt đầu', lessons: ['fx-demo'] }]
    }
  ],
  lessons: {
    'fx-demo': { title: 'Fixture · năm loại screen', newKeys: ['j', 'f', ' '], screens: 6, estMinutes: 3, kind: 'keys' }
  },
  sequence: ['fx-demo'],
  starter: { lessonId: 'fx-demo', screen: 2, content: 'jjj fff jjj fff jf fj' }
};
