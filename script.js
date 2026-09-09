/* =================================================================================================
   BẢNG CHUỖI VÀ DỮ LIỆU (giữ nguyên).
   `lessons`, `lessonSecondLines`, `translations`, `homeActionText`, `weakKeyUi`, `coachUi`,
   `coachTrendHint`, `dailyGoalUi`, `rows`, `fingerMap`, `localizedLessonName` là DI SẢN của
   engine 30 bài cũ. Chúng không còn được trang chủ dùng, nhưng DECISIONS.md quyết định 4 yêu cầu
   giữ lại các bảng chuỗi zh/ru/pt/pt-BR/ar/ms để còn bật lại 9 ngôn ngữ được — nên không xoá.
   Phần trang chủ mới bắt đầu ở khối "TRANG CHỦ (Phase 3)" phía dưới và chỉ dùng:
   `siteLanguages`, `activeLanguage`, `formatUi`, `currentLocalizedUi`.
================================================================================================= */
const lessons = [
  ['Cơ sở: ASDF JKL;', 'asdf jkl; asdf jkl; asdf jkl; asdf jkl;'],
  ['Cơ sở: đổi tay', 'a s d f j k l; f d s a ; l k j'],
  ['Ngón trỏ trái', 'f f f r r r v v v f r v f r v'],
  ['Ngón trỏ phải', 'j j j u u u m m m j u m j u m'],
  ['Hai ngón trỏ', 'fj fj rf uj vm jm fr ju fv um'],
  ['Ngón giữa', 'd k d k e i c , d e c k i ,'],
  ['Ngón áp út', 's l s l w o x . s w x l o .'],
  ['Ngón út', 'a ; a ; q p z / a q z ; p /'],
  ['Hàng cơ sở dài', 'sad fall ask dad; all lads fall;'],
  ['Từ đơn giản', 'fall all ask sad dad flask salad'],
  ['Hàng trên: trái', 'q w e r t q w e r t tree water'],
  ['Hàng trên: phải', 'y u i o p y u i o p you type'],
  ['Hàng trên phối hợp', 'type writer quiet power your time'],
  ['Hàng dưới: trái', 'z x c v b z x c v b brave cave'],
  ['Hàng dưới: phải', 'n m , . / n m , . / minimum'],
  ['Hàng dưới phối hợp', 'zoom can move very calmly now'],
  ['Ba hàng: trái', 'read fast cave wax bad red face'],
  ['Ba hàng: phải', 'jump into moon pool milk kind'],
  ['Từ thông dụng 1', 'the quick brown fox jumps over'],
  ['Từ thông dụng 2', 'practice makes progress every day'],
  ['Câu ngắn 1', 'keep your hands on the home row.'],
  ['Câu ngắn 2', 'slow is smooth and smooth is fast.'],
  ['Chữ hoa', 'Hello World. Good Typing Starts Here.'],
  ['Số hàng trên', '123 456 789 0 123 456 789 0'],
  ['Dấu câu', 'hello, world. are you ready? yes!'],
  ['Email cơ bản', 'hello@example.com is a simple address.'],
  ['Tốc độ 1', 'focus on accuracy before you type faster'],
  ['Tốc độ 2', 'small daily practice builds strong habits'],
  ['Đoạn văn ngắn', 'typing with all ten fingers saves time every day.'],
  ['Thử thách cuối', 'keep calm, look ahead, and type with confidence!']
];
const lessonSecondLines = [
  'jkl; asdf jkl; asdf jkl; asdf', 'j f d s a ; l k j f d s a', 'v f r v f r v f r v f r',
  'm j u m j u m j u m j u', 'ju fr vm fj uj fr vm fj uj', 'e d c k i , e d c k i ,',
  'x s w l o . x s w l o .', 'z a q ; p / z a q ; p /', 'all dads ask; fall salad fast;',
  'glass flask falls; sad lads ask;', 'water tree were quiet at work', 'you type up your input properly',
  'write your quiet reply to power', 'cave brave wax can be exact', 'minimum memory moves normally', 'move now, zoom very calmly',
  'face red wax can be fast', 'milk and moon jump into room', 'over the lazy dog with ease',
  'daily practice makes typing easy', 'rest your wrists and relax now.', 'accuracy comes before quick speed.',
  'Typing Well Needs Calm Focus.', '098 765 432 1 098 765 432 1', 'wait; type, then check it.',
  'sample.user@typing.com is ready.', 'steady hands create better results', 'repeat good habits every morning',
  'each lesson helps your fingers learn.', 'finish with focus and enjoy progress!'
];
lessons.forEach((lesson, index) => { lesson[1] = `${lesson[1]}\n${lessonSecondLines[index]}`; });
const translations = {
  vi: {navPractice:'Luyện gõ',navGuide:'Hướng dẫn',navResults:'Thành tích',login:'Đăng nhập',dailyPractice:'Luyện gõ mỗi ngày',intro:'Cải thiện kỹ năng gõ 10 ngón với những bài tập ngắn, rõ ràng và hoàn toàn miễn phí.',start:'Bắt đầu luyện gõ',ready:'Sẵn sàng chưa?',practiceNow:'Luyện ngay bây giờ',basic:'Bài cơ bản',free:'Tự do',path:'Lộ trình 10 ngón',speed:'Tốc độ',accuracy:'Độ chính xác',time:'Thời gian',startHere:'Bắt đầu gõ tại đây'},
  en: {navPractice:'Typing practice',navGuide:'Guide',navResults:'Results',login:'Sign in',dailyPractice:'Practice every day',intro:'Improve your touch typing with clear, focused exercises that are completely free.',start:'Start typing',ready:'Ready to begin?',practiceNow:'Practice now',basic:'Lessons',free:'Free type',path:'Touch typing path',speed:'Speed',accuracy:'Accuracy',time:'Time',startHere:'Start typing here'},
  la: {navPractice:'Exercitatio',navGuide:'Ductio',navResults:'Profectus',login:'Intra',dailyPractice:'Cotidie exerce',intro:'Artem digitis decem scribendi exerce per lectiones claras atque gratuitas.',start:'Incipe scribere',ready:'Paratusne es?',practiceNow:'Nunc exerce',basic:'Lectiones',free:'Liber scribendi',path:'Iter digitorum decem',speed:'Celeritas',accuracy:'Diligentia',time:'Tempus',startHere:'Hic scribe'}
};
const siteLanguages = {
  vi:{nav:['Luyện gõ','Hướng dẫn','Thành tích'],login:'Đăng nhập',daily:'Luyện gõ mỗi ngày',hero:['Luyện gõ 10 ngón','online miễn phí.'],intro:'Luyện gõ 10 ngón online miễn phí — bắt đầu ngay, không cần đăng ký.',start:'Bắt đầu luyện gõ',learn:'Tìm hiểu cách luyện',ready:'Sẵn sàng chưa?',practice:'Luyện ngay bây giờ',basic:'Bài cơ bản',free:'Tự do',path:'Lộ trình 10 ngón',speed:'Tốc độ',accuracy:'Độ chính xác',time:'Thời gian',keyboard:'Bàn phím & ngón tay',results:'Thành tích bài học',benefits:'Tiến bộ từng phím bấm.'},
  en:{nav:['Practice','Guides','Progress'],login:'Sign in',daily:'Practice every day',hero:['Type faster.','Feel lighter.'],intro:'Improve touch typing with clear, focused exercises that are completely free.',start:'Start typing',learn:'Learn how it works',ready:'Ready to begin?',practice:'Practice now',basic:'Lessons',free:'Free type',path:'Touch typing course',speed:'Speed',accuracy:'Accuracy',time:'Time',keyboard:'Keyboard & fingers',results:'Lesson records',benefits:'Progress with every key.'},
  zh:{nav:['练习打字','指南','成绩'],login:'登录',daily:'每天练习打字',hero:['打得更快。','更加轻松。'],intro:'通过清晰、专注且完全免费的练习，提高十指盲打能力。',start:'开始练习',learn:'了解练习方法',ready:'准备好了吗？',practice:'立即练习',basic:'基础课程',free:'自由练习',path:'十指打字路径',speed:'速度',accuracy:'准确率',time:'时间',keyboard:'键盘与手指',results:'课程成绩',benefits:'每一次按键都有进步。'},
  ja:{nav:['タイピング練習','ガイド','記録'],login:'ログイン',daily:'毎日タイピング練習',hero:['もっと速く。','もっと楽に。'],intro:'分かりやすく無料の練習で、タッチタイピングを上達させましょう。',start:'練習を始める',learn:'練習方法を見る',ready:'準備はいいですか？',practice:'今すぐ練習',basic:'基本レッスン',free:'自由入力',path:'10本指の学習',speed:'速度',accuracy:'正確性',time:'時間',keyboard:'キーボードと指',results:'レッスン記録',benefits:'一打ずつ上達。'},
  ru:{nav:['Практика','Руководство','Результаты'],login:'Войти',daily:'Практикуйтесь каждый день',hero:['Печатайте быстрее.','Чувствуйте лёгкость.'],intro:'Улучшайте слепой набор с понятными и полностью бесплатными упражнениями.',start:'Начать печатать',learn:'Как тренироваться',ready:'Готовы начать?',practice:'Практиковаться',basic:'Уроки',free:'Свободный набор',path:'Путь десятипальцевой печати',speed:'Скорость',accuracy:'Точность',time:'Время',keyboard:'Клавиатура и пальцы',results:'Рекорды уроков',benefits:'Прогресс с каждой клавишей.'},
  pt:{nav:['Praticar','Guia','Resultados'],login:'Entrar',daily:'Pratique todos os dias',hero:['Digite mais rápido.','Com mais leveza.'],intro:'Melhore a digitação com exercícios claros, focados e totalmente gratuitos.',start:'Começar a praticar',learn:'Saber como praticar',ready:'Tudo pronto?',practice:'Pratique agora',basic:'Lições básicas',free:'Prática livre',path:'Percurso de digitação',speed:'Velocidade',accuracy:'Precisão',time:'Tempo',keyboard:'Teclado e dedos',results:'Resultados das lições',benefits:'Progresso a cada tecla.'},
  'pt-BR':{nav:['Praticar','Guia','Resultados'],login:'Entrar',daily:'Pratique todos os dias',hero:['Digite mais rápido.','Com mais leveza.'],intro:'Melhore sua digitação com exercícios claros, focados e totalmente gratuitos.',start:'Começar a treinar',learn:'Como praticar',ready:'Pronto para começar?',practice:'Treine agora',basic:'Lições básicas',free:'Prática livre',path:'Trilha de digitação',speed:'Velocidade',accuracy:'Precisão',time:'Tempo',keyboard:'Teclado e dedos',results:'Resultados das lições',benefits:'Progresso a cada tecla.'},
  ar:{nav:['التدريب','الدليل','النتائج'],login:'تسجيل الدخول',daily:'تدرّب كل يوم',hero:['اكتب أسرع.','براحة أكبر.'],intro:'حسّن الطباعة باللمس عبر تمارين واضحة ومجانية تماماً.',start:'ابدأ التدريب',learn:'تعرّف على الطريقة',ready:'هل أنت مستعد؟',practice:'تدرّب الآن',basic:'الدروس الأساسية',free:'تدريب حر',path:'مسار الطباعة بعشرة أصابع',speed:'السرعة',accuracy:'الدقة',time:'الوقت',keyboard:'لوحة المفاتيح والأصابع',results:'نتائج الدروس',benefits:'تقدم مع كل مفتاح.'},
  ms:{nav:['Latihan','Panduan','Pencapaian'],login:'Log masuk',daily:'Berlatih setiap hari',hero:['Taip lebih pantas.','Lebih selesa.'],intro:'Tingkatkan kemahiran menaip sentuh dengan latihan yang jelas dan percuma.',start:'Mula menaip',learn:'Cara berlatih',ready:'Sudah bersedia?',practice:'Berlatih sekarang',basic:'Pelajaran asas',free:'Latihan bebas',path:'Laluan menaip 10 jari',speed:'Kelajuan',accuracy:'Ketepatan',time:'Masa',keyboard:'Papan kekunci & jari',results:'Rekod pelajaran',benefits:'Maju pada setiap kekunci.'}
};
let activeLanguage = 'vi';
const homeActionText = {
  vi: { start:'Bắt đầu bài 1', speedTest:'Kiểm tra tốc độ 60 giây', continue:'Tiếp tục bài', trust:'Luyện gõ miễn phí, không cần đăng ký.', showAll:'Xem toàn bộ 30 bài', collapse:'Thu gọn' },
  en: { start:'Start lesson 1', speedTest:'Take the 60-second speed test', continue:'Continue lesson', trust:'Free typing practice, no sign-up required.', showAll:'View all 30 lessons', collapse:'Collapse' },
  zh: { start:'开始第 1 课', speedTest:'进行 60 秒速度测试', continue:'继续第', trust:'免费练习打字，无需注册。', showAll:'查看全部 30 课', collapse:'收起' },
  ja: { start:'レッスン 1 を始める', speedTest:'60秒スピードテスト', continue:'レッスンを続ける', trust:'無料で練習できます。登録は不要です。', showAll:'全30レッスンを見る', collapse:'閉じる' },
  ru: { start:'Начать урок 1', speedTest:'Тест скорости: 60 секунд', continue:'Продолжить урок', trust:'Бесплатная практика без регистрации.', showAll:'Показать все 30 уроков', collapse:'Свернуть' },
  pt: { start:'Começar a lição 1', speedTest:'Teste de velocidade de 60 segundos', continue:'Continuar lição', trust:'Pratique grátis, sem cadastro.', showAll:'Ver todas as 30 lições', collapse:'Mostrar menos' },
  'pt-BR': { start:'Começar a lição 1', speedTest:'Teste de velocidade de 60 segundos', continue:'Continuar lição', trust:'Pratique grátis, sem cadastro.', showAll:'Ver todas as 30 lições', collapse:'Mostrar menos' },
  ar: { start:'ابدأ الدرس 1', speedTest:'اختبار سرعة لمدة 60 ثانية', continue:'تابع الدرس', trust:'تدرب مجاناً، دون تسجيل.', showAll:'عرض الدروس الثلاثين', collapse:'عرض أقل' },
  ms: { start:'Mula pelajaran 1', speedTest:'Ujian kelajuan 60 saat', continue:'Sambung pelajaran', trust:'Latihan percuma, tanpa pendaftaran.', showAll:'Lihat semua 30 pelajaran', collapse:'Ringkaskan' }
};
function currentHomeActionText() { return homeActionText[activeLanguage] || homeActionText.en; }
const localizedUi = {
  vi: { errors:'Số lỗi', notYet:'Chưa có', next:'Bài tiếp theo →', retry:'↻ Làm lại bài này', perfect:'Hoàn thành xuất sắc! Bạn có thể sang bài tiếp theo hoặc luyện lại.', accuracy:'Bạn đã hoàn thành với độ chính xác {accuracy}%. Hãy luyện lại để cải thiện nhé.', exploreTag:'Tài nguyên TypingEase', exploreTitle:'Khám phá TypingEase', explore:[['Cách gõ 10 ngón','Hướng dẫn vị trí ngón tay, hàng phím cơ sở và cách luyện gõ đúng kỹ thuật cho người mới.','Xem hướng dẫn'],['Kiểm tra tốc độ đánh máy','Làm bài typing test 60 giây để kiểm tra WPM, độ chính xác và tốc độ gõ hiện tại của bạn.','Kiểm tra ngay'],['WPM là gì?','Tìm hiểu WPM, cách tính tốc độ đánh máy và vì sao WPM nên được xem cùng độ chính xác.','Tìm hiểu WPM']], game:{tab:'Trò chơi',kicker:'THỬ THÁCH 30 GIÂY',title:'Đấu tốc độ',description:'Gõ càng đúng và nhanh, điểm thành tích càng cao.',time:'Thời gian',score:'Điểm',best:'Kỷ lục',idle:'Nhấn bắt đầu để nhận thử thách.',placeholder:'Gõ tại đây khi thử thách bắt đầu...',start:'Bắt đầu thử thách',running:'Đang thi đấu...',status:'Mỗi lượt thi kéo dài 30 giây.',focus:'Tập trung, gõ nhanh và chính xác!',finish:'Hoàn thành! Bạn đạt {score} điểm.',replay:'Chơi lại'} },
  en: { errors:'Errors', notYet:'Not yet', next:'Next lesson →', retry:'↻ Try this lesson again', perfect:'Excellent! Continue to the next lesson or practise again.', accuracy:'You finished with {accuracy}% accuracy. Practise again to improve.', exploreTag:'TypingEase resources', exploreTitle:'Explore TypingEase', explore:[['How to touch type','Learn finger placement, the home row, and proper touch-typing technique for beginners.','View guide'],['Check typing speed','Take a 60-second typing test to check your WPM, accuracy, and current typing speed.','Check now'],['What is WPM?','Learn what WPM means, how typing speed is calculated, and why accuracy matters too.','Learn about WPM']], game:{tab:'Game',kicker:'30-SECOND CHALLENGE',title:'Speed challenge',description:'Type accurately and quickly to earn a higher score.',time:'Time',score:'Score',best:'Best',idle:'Press start to receive a challenge.',placeholder:'Type here when the challenge starts...',start:'Start challenge',running:'Competing...',status:'Each round lasts 30 seconds.',focus:'Focus, type quickly, and stay accurate!',finish:'Complete! You scored {score} points.',replay:'Play again'} },
  zh: { errors:'错误数', notYet:'暂无', next:'下一课 →', retry:'↻ 再练一次', perfect:'完成得很出色！继续下一课或再练一次。', accuracy:'你以 {accuracy}% 的准确率完成了练习。再练一次以继续提高。', exploreTag:'TypingEase 资源', exploreTitle:'探索 TypingEase', explore:[['十指打字方法','学习手指位置、基本键位和适合初学者的正确打字方法。','查看指南'],['测试打字速度','完成 60 秒打字测试，查看 WPM、准确率和当前打字速度。','立即测试'],['什么是 WPM？','了解 WPM、打字速度的计算方式，以及为什么准确率同样重要。','了解 WPM']], game:{tab:'游戏',kicker:'30 秒挑战',title:'速度挑战',description:'打得又快又准，获得更高分数。',time:'时间',score:'得分',best:'纪录',idle:'点击开始以获取挑战。',placeholder:'挑战开始后在这里输入...',start:'开始挑战',running:'挑战中...',status:'每轮持续 30 秒。',focus:'集中注意力，快速且准确地输入！',finish:'完成！你获得了 {score} 分。',replay:'再玩一次'} },
  ja: { errors:'ミス', notYet:'まだありません', next:'次のレッスン →', retry:'↻ このレッスンをもう一度', perfect:'素晴らしい完了です！次のレッスンへ進むか、もう一度練習できます。', accuracy:'正確率 {accuracy}% で完了しました。もう一度練習して上達しましょう。', exploreTag:'TypingEase のリソース', exploreTitle:'TypingEase を見る', explore:[['10本指入力の方法','指の位置、ホームポジション、初心者向けの正しいタッチタイピングを学びます。','ガイドを見る'],['入力速度をチェック','60秒テストで WPM、正確性、現在の入力速度を確認できます。','今すぐチェック'],['WPM とは？','WPM の意味、入力速度の計算方法、正確性が重要な理由を学びます。','WPM を学ぶ']], game:{tab:'ゲーム',kicker:'30秒チャレンジ',title:'スピードチャレンジ',description:'正確かつ速く入力して高得点を目指しましょう。',time:'時間',score:'スコア',best:'ベスト',idle:'開始を押してチャレンジを受け取りましょう。',placeholder:'チャレンジ開始後にここへ入力...',start:'チャレンジを開始',running:'挑戦中...',status:'1ラウンドは30秒です。',focus:'集中して、速く正確に入力しましょう！',finish:'完了！{score} 点を獲得しました。',replay:'もう一度'} },
  ru: { errors:'Ошибки', notYet:'Пока нет', next:'Следующий урок →', retry:'↻ Повторить этот урок', perfect:'Отлично! Перейдите к следующему уроку или потренируйтесь ещё раз.', accuracy:'Вы завершили урок с точностью {accuracy}%. Попробуйте ещё раз, чтобы улучшить результат.', exploreTag:'Ресурсы TypingEase', exploreTitle:'Откройте TypingEase', explore:[['Как печатать десятью пальцами','Изучите положение пальцев, домашний ряд и правильную технику для начинающих.','Открыть руководство'],['Проверить скорость печати','Пройдите 60-секундный тест, чтобы узнать WPM, точность и скорость печати.','Проверить сейчас'],['Что такое WPM?','Узнайте, что такое WPM, как рассчитывается скорость и почему важна точность.','Узнать о WPM']], game:{tab:'Игра',kicker:'30-СЕКУНДНЫЙ ВЫЗОВ',title:'Скоростной вызов',description:'Печатайте быстро и точно, чтобы набрать больше очков.',time:'Время',score:'Очки',best:'Рекорд',idle:'Нажмите «Начать», чтобы получить задание.',placeholder:'Печатайте здесь после начала задания...',start:'Начать вызов',running:'Идёт игра...',status:'Каждый раунд длится 30 секунд.',focus:'Сосредоточьтесь, печатайте быстро и точно!',finish:'Готово! Вы набрали {score} очков.',replay:'Играть снова'} },
  pt: { errors:'Erros', notYet:'Ainda não', next:'Próxima lição →', retry:'↻ Tentar esta lição novamente', perfect:'Excelente! Continue para a próxima lição ou pratique novamente.', accuracy:'Você concluiu com {accuracy}% de precisão. Pratique novamente para melhorar.', exploreTag:'Recursos TypingEase', exploreTitle:'Conheça o TypingEase', explore:[['Como digitar com dez dedos','Aprenda a posição dos dedos, a fileira base e a técnica correta para iniciantes.','Ver guia'],['Verificar velocidade de digitação','Faça um teste de 60 segundos para verificar WPM, precisão e velocidade atual.','Verificar agora'],['O que é WPM?','Entenda WPM, como a velocidade é calculada e por que a precisão também importa.','Saber mais sobre WPM']], game:{tab:'Jogo',kicker:'DESAFIO DE 30 SEGUNDOS',title:'Desafio de velocidade',description:'Digite com rapidez e precisão para ganhar mais pontos.',time:'Tempo',score:'Pontuação',best:'Recorde',idle:'Pressione iniciar para receber um desafio.',placeholder:'Digite aqui quando o desafio começar...',start:'Iniciar desafio',running:'Em desafio...',status:'Cada rodada dura 30 segundos.',focus:'Concentre-se, digite rápido e com precisão!',finish:'Concluído! Você marcou {score} pontos.',replay:'Jogar novamente'} },
  'pt-BR': { errors:'Erros', notYet:'Ainda não', next:'Próxima lição →', retry:'↻ Tentar esta lição novamente', perfect:'Excelente! Continue para a próxima lição ou pratique novamente.', accuracy:'Você concluiu com {accuracy}% de precisão. Pratique novamente para melhorar.', exploreTag:'Recursos TypingEase', exploreTitle:'Conheça o TypingEase', explore:[['Como digitar com dez dedos','Aprenda a posição dos dedos, a fileira base e a técnica correta para iniciantes.','Ver guia'],['Verificar velocidade de digitação','Faça um teste de 60 segundos para verificar WPM, precisão e velocidade atual.','Verificar agora'],['O que é WPM?','Entenda WPM, como a velocidade é calculada e por que a precisão também importa.','Saber mais sobre WPM']], game:{tab:'Jogo',kicker:'DESAFIO DE 30 SEGUNDOS',title:'Desafio de velocidade',description:'Digite com rapidez e precisão para ganhar mais pontos.',time:'Tempo',score:'Pontuação',best:'Recorde',idle:'Pressione iniciar para receber um desafio.',placeholder:'Digite aqui quando o desafio começar...',start:'Iniciar desafio',running:'Em desafio...',status:'Cada rodada dura 30 segundos.',focus:'Concentre-se, digite rápido e com precisão!',finish:'Concluído! Você marcou {score} pontos.',replay:'Jogar novamente'} },
  ar: { errors:'الأخطاء', notYet:'ليس بعد', next:'الدرس التالي ←', retry:'↻ أعد هذا الدرس', perfect:'أحسنت! يمكنك متابعة الدرس التالي أو التدريب مجدداً.', accuracy:'أنهيت التمرين بدقة {accuracy}%. تدرب مجدداً للتحسن.', exploreTag:'موارد TypingEase', exploreTitle:'استكشف TypingEase', explore:[['كيفية الكتابة بعشرة أصابع','تعلّم مواضع الأصابع وصف الارتكاز وطريقة الكتابة الصحيحة للمبتدئين.','عرض الدليل'],['اختبر سرعة الكتابة','أجرِ اختباراً لمدة 60 ثانية لمعرفة WPM والدقة وسرعة كتابتك الحالية.','اختبر الآن'],['ما هو WPM؟','تعرّف على WPM وطريقة حساب السرعة وأهمية الدقة.','تعرّف على WPM']], game:{tab:'لعبة',kicker:'تحدي 30 ثانية',title:'تحدي السرعة',description:'اكتب بسرعة ودقة لتحصل على نقاط أكثر.',time:'الوقت',score:'النقاط',best:'أفضل نتيجة',idle:'اضغط ابدأ لتلقي التحدي.',placeholder:'اكتب هنا عند بدء التحدي...',start:'ابدأ التحدي',running:'قيد التحدي...',status:'تستمر كل جولة 30 ثانية.',focus:'ركّز واكتب بسرعة ودقة!',finish:'اكتمل! حصلت على {score} نقطة.',replay:'العب مجدداً'} },
  ms: { errors:'Ralat', notYet:'Belum ada', next:'Pelajaran seterusnya →', retry:'↻ Cuba pelajaran ini lagi', perfect:'Cemerlang! Teruskan ke pelajaran seterusnya atau berlatih lagi.', accuracy:'Anda selesai dengan ketepatan {accuracy}%. Berlatih lagi untuk meningkat.', exploreTag:'Sumber TypingEase', exploreTitle:'Terokai TypingEase', explore:[['Cara menaip 10 jari','Pelajari kedudukan jari, baris asas dan teknik menaip yang betul untuk pemula.','Lihat panduan'],['Semak kelajuan menaip','Ambil ujian 60 saat untuk menyemak WPM, ketepatan dan kelajuan menaip semasa.','Semak sekarang'],['Apakah WPM?','Ketahui maksud WPM, cara kelajuan dikira dan sebab ketepatan juga penting.','Ketahui WPM']], game:{tab:'Permainan',kicker:'CABARAN 30 SAAT',title:'Cabaran kelajuan',description:'Taip dengan pantas dan tepat untuk memperoleh markah lebih tinggi.',time:'Masa',score:'Markah',best:'Rekod',idle:'Tekan mula untuk menerima cabaran.',placeholder:'Taip di sini apabila cabaran bermula...',start:'Mula cabaran',running:'Sedang mencabar...',status:'Setiap pusingan berlangsung 30 saat.',focus:'Fokus, taip pantas dan tepat!',finish:'Selesai! Anda memperoleh {score} mata.',replay:'Main lagi'} }
};
function currentLocalizedUi() { return localizedUi[activeLanguage] || localizedUi.en; }
function formatUi(template, values) { return Object.entries(values).reduce((text, [key, value]) => text.replace(`{${key}}`, value), template); }
const weakKeyUi = {
  vi:{title:'Phím cần luyện thêm',empty:'Bạn chưa có phím yếu nổi bật trong bài này.',practice:'Luyện phím yếu',mode:'Luyện phím yếu',mistakes:'{count} lỗi'},
  en:{title:'Keys to practise',empty:'You have no standout weak keys in this lesson.',practice:'Practise weak keys',mode:'Weak-key practice',mistakes:'{count} mistakes'},
  zh:{title:'需要多练的按键',empty:'本课没有明显需要加强的按键。',practice:'练习薄弱按键',mode:'薄弱按键练习',mistakes:'{count} 个错误'},
  ja:{title:'重点的練習キー',empty:'このレッスンでは目立った苦手なキーはありません。',practice:'苦手なキーを練習',mode:'苦手なキーの練習',mistakes:'{count} 回のミス'},
  ru:{title:'Клавиши для практики',empty:'В этом уроке нет заметно слабых клавиш.',practice:'Тренировать слабые клавиши',mode:'Тренировка слабых клавиш',mistakes:'{count} ошибок'},
  pt:{title:'Teclas para praticar',empty:'Não há teclas fracas em destaque nesta lição.',practice:'Praticar teclas fracas',mode:'Prática de teclas fracas',mistakes:'{count} erros'},
  'pt-BR':{title:'Teclas para praticar',empty:'Não há teclas fracas em destaque nesta lição.',practice:'Praticar teclas fracas',mode:'Prática de teclas fracas',mistakes:'{count} erros'},
  ar:{title:'مفاتيح تحتاج إلى تدريب',empty:'لا توجد مفاتيح ضعيفة بارزة في هذا الدرس.',practice:'تدرب على المفاتيح الضعيفة',mode:'تدريب المفاتيح الضعيفة',mistakes:'{count} أخطاء'},
  ms:{title:'Kekunci untuk dilatih',empty:'Tiada kekunci lemah yang menonjol dalam pelajaran ini.',practice:'Latih kekunci lemah',mode:'Latihan kekunci lemah',mistakes:'{count} kesilapan'}
};
function currentWeakKeyUi() { return weakKeyUi[activeLanguage] || weakKeyUi.en; }
const coachUi = {
  vi:{kicker:'Huấn luyện cá nhân',title:'Trình độ của bạn',levels:['Mới bắt đầu','Đang lên tay','Ổn định','Nhanh','Thành thạo'],statSpeed:'WPM gần đây',statAccuracy:'Chính xác',statSessions:'Lượt luyện',target:'Mục tiêu kế tiếp: {wpm} WPM · {accuracy}% chính xác',heatTitle:'Độ chính xác từng phím',heat:['Chắc tay','Tạm ổn','Cần luyện'],
    advice:{start:'Gõ thử một bài để hệ thống đo trình độ của bạn.',next:'Bạn đang tiến đều, sang bài {lesson} thôi.',repeat:'Độ chính xác bài {lesson} còn dưới mục tiêu, làm lại một lượt nữa nhé.',review:'Bài {lesson} còn yếu, ôn lại sẽ chắc tay hơn.',weak:'Phím {keys} đang kéo tốc độ xuống, luyện riêng một phút.'},
    action:{start:'Bắt đầu bài {lesson}',next:'Học bài {lesson}',repeat:'Làm lại bài {lesson}',review:'Ôn bài {lesson}',weak:'Luyện phím {keys}'}},
  en:{kicker:'Personal coach',title:'Your level',levels:['Getting started','Building up','Steady','Fast','Fluent'],statSpeed:'Recent WPM',statAccuracy:'Accuracy',statSessions:'Sessions',target:'Next target: {wpm} WPM · {accuracy}% accuracy',heatTitle:'Per-key accuracy',heat:['Solid','Fair','Needs work'],
    advice:{start:'Type one lesson so the coach can measure your level.',next:'You are progressing well, move on to lesson {lesson}.',repeat:'Accuracy on lesson {lesson} is below your target, run it once more.',review:'Lesson {lesson} is still shaky, a review will lock it in.',weak:'The {keys} keys are slowing you down, drill them for a minute.'},
    action:{start:'Start lesson {lesson}',next:'Open lesson {lesson}',repeat:'Retry lesson {lesson}',review:'Review lesson {lesson}',weak:'Drill {keys}'}},
  zh:{kicker:'个人教练',title:'你的水平',levels:['入门','进步中','稳定','快速','熟练'],statSpeed:'近期 WPM',statAccuracy:'准确率',statSessions:'练习次数',target:'下一个目标：{wpm} WPM · 准确率 {accuracy}%',heatTitle:'各按键准确率',heat:['扎实','一般','需加强'],
    advice:{start:'先打一课，系统就能了解你的水平。',next:'进步稳定，去第 {lesson} 课吧。',repeat:'第 {lesson} 课的准确率还没达标，再练一次。',review:'第 {lesson} 课还不稳，复习一下更扎实。',weak:'{keys} 键拖慢了你的速度，专门练一分钟。'},
    action:{start:'开始第 {lesson} 课',next:'进入第 {lesson} 课',repeat:'重做第 {lesson} 课',review:'复习第 {lesson} 课',weak:'练习 {keys}'}},
  ja:{kicker:'パーソナルコーチ',title:'あなたのレベル',levels:['入門','上達中','安定','高速','熟練'],statSpeed:'最近の WPM',statAccuracy:'正確率',statSessions:'練習回数',target:'次の目標：{wpm} WPM・正確率 {accuracy}%',heatTitle:'キー別の正確率',heat:['得意','まずまず','要練習'],
    advice:{start:'まず 1 レッスン打つと、あなたのレベルを測定します。',next:'順調です。レッスン {lesson} に進みましょう。',repeat:'レッスン {lesson} の正確率が目標未満です。もう一度どうぞ。',review:'レッスン {lesson} がまだ不安定です。復習しましょう。',weak:'{keys} キーが速度を落としています。1 分だけ集中練習を。'},
    action:{start:'レッスン {lesson} を始める',next:'レッスン {lesson} へ',repeat:'レッスン {lesson} をやり直す',review:'レッスン {lesson} を復習',weak:'{keys} を練習'}},
  ru:{kicker:'Личный тренер',title:'Ваш уровень',levels:['Начальный','Развитие','Уверенный','Быстрый','Продвинутый'],statSpeed:'WPM за последнее время',statAccuracy:'Точность',statSessions:'Занятий',target:'Следующая цель: {wpm} WPM · точность {accuracy}%',heatTitle:'Точность по клавишам',heat:['Уверенно','Средне','Нужна практика'],
    advice:{start:'Пройдите один урок, чтобы тренер оценил ваш уровень.',next:'Вы стабильно растёте, переходите к уроку {lesson}.',repeat:'Точность в уроке {lesson} ниже цели, пройдите его ещё раз.',review:'Урок {lesson} пока нестабилен, повторение закрепит его.',weak:'Клавиши {keys} замедляют вас, потренируйте их минуту.'},
    action:{start:'Начать урок {lesson}',next:'Открыть урок {lesson}',repeat:'Пройти урок {lesson} снова',review:'Повторить урок {lesson}',weak:'Тренировать {keys}'}},
  pt:{kicker:'Treinador pessoal',title:'Seu nível',levels:['Iniciante','Evoluindo','Estável','Rápido','Fluente'],statSpeed:'WPM recente',statAccuracy:'Precisão',statSessions:'Sessões',target:'Próxima meta: {wpm} WPM · {accuracy}% de precisão',heatTitle:'Precisão por tecla',heat:['Firme','Razoável','Precisa treinar'],
    advice:{start:'Faça uma lição para o treinador medir seu nível.',next:'Você está evoluindo bem, siga para a lição {lesson}.',repeat:'A precisão na lição {lesson} está abaixo da meta, repita uma vez.',review:'A lição {lesson} ainda está instável, revisar vai firmar.',weak:'As teclas {keys} estão te atrasando, treine um minuto.'},
    action:{start:'Começar a lição {lesson}',next:'Abrir a lição {lesson}',repeat:'Refazer a lição {lesson}',review:'Revisar a lição {lesson}',weak:'Treinar {keys}'}},
  'pt-BR':{kicker:'Treinador pessoal',title:'Seu nível',levels:['Iniciante','Evoluindo','Estável','Rápido','Fluente'],statSpeed:'WPM recente',statAccuracy:'Precisão',statSessions:'Sessões',target:'Próxima meta: {wpm} WPM · {accuracy}% de precisão',heatTitle:'Precisão por tecla',heat:['Firme','Razoável','Precisa treinar'],
    advice:{start:'Faça uma lição para o treinador medir seu nível.',next:'Você está evoluindo bem, siga para a lição {lesson}.',repeat:'A precisão na lição {lesson} está abaixo da meta, repita uma vez.',review:'A lição {lesson} ainda está instável, revisar vai firmar.',weak:'As teclas {keys} estão te atrasando, treine um minuto.'},
    action:{start:'Começar a lição {lesson}',next:'Abrir a lição {lesson}',repeat:'Refazer a lição {lesson}',review:'Revisar a lição {lesson}',weak:'Treinar {keys}'}},
  ar:{kicker:'مدرّبك الشخصي',title:'مستواك',levels:['مبتدئ','في تقدّم','ثابت','سريع','متمكّن'],statSpeed:'سرعة WPM الأخيرة',statAccuracy:'الدقة',statSessions:'الجلسات',target:'الهدف التالي: {wpm} كلمة/دقيقة · دقة {accuracy}%',heatTitle:'الدقة لكل مفتاح',heat:['متقن','مقبول','يحتاج تدريباً'],
    advice:{start:'اكتب درساً واحداً ليتعرف المدرب على مستواك.',next:'تقدّمك ثابت، انتقل إلى الدرس {lesson}.',repeat:'الدقة في الدرس {lesson} أقل من هدفك، أعده مرة أخرى.',review:'الدرس {lesson} ما زال ضعيفاً، المراجعة ستثبّته.',weak:'المفاتيح {keys} تبطئك، تدرّب عليها دقيقة.'},
    action:{start:'ابدأ الدرس {lesson}',next:'افتح الدرس {lesson}',repeat:'أعد الدرس {lesson}',review:'راجع الدرس {lesson}',weak:'تدرّب على {keys}'}},
  ms:{kicker:'Jurulatih peribadi',title:'Tahap anda',levels:['Permulaan','Semakin baik','Stabil','Pantas','Mahir'],statSpeed:'WPM terkini',statAccuracy:'Ketepatan',statSessions:'Sesi',target:'Sasaran seterusnya: {wpm} WPM · ketepatan {accuracy}%',heatTitle:'Ketepatan setiap kekunci',heat:['Mantap','Sederhana','Perlu latihan'],
    advice:{start:'Buat satu pelajaran supaya jurulatih tahu tahap anda.',next:'Anda maju dengan baik, teruskan ke pelajaran {lesson}.',repeat:'Ketepatan pelajaran {lesson} bawah sasaran, ulang sekali lagi.',review:'Pelajaran {lesson} masih goyah, ulang kaji untuk mantap.',weak:'Kekunci {keys} melambatkan anda, latih seminit.'},
    action:{start:'Mula pelajaran {lesson}',next:'Buka pelajaran {lesson}',repeat:'Ulang pelajaran {lesson}',review:'Ulang kaji pelajaran {lesson}',weak:'Latih {keys}'}}
};
function currentCoachUi() { return coachUi[activeLanguage] || coachUi.en; }
const coachTrendHint = {
  vi:'Cần thêm {count} bài nữa để vẽ biểu đồ tiến bộ.',
  en:'Finish {count} more lesson(s) to draw your progress chart.',
  zh:'再完成 {count} 节课即可生成进度图表。',
  ja:'あと {count} レッスンで進捗グラフを表示します。',
  ru:'Пройдите ещё {count} урок(а), чтобы построить график прогресса.',
  pt:'Conclua {count} lição(ões) para ver o gráfico de progresso.',
  'pt-BR':'Conclua {count} lição(ões) para ver o gráfico de progresso.',
  ar:'أكمل {count} درساً آخر لرسم مخطط تقدمك.',
  ms:'Selesaikan {count} pelajaran lagi untuk melihat graf kemajuan.'
};
const dailyGoalUi = {
  vi:{kicker:'Mục tiêu hôm nay',minutes:'{done} / {goal} phút',streak:'🔥 {count} ngày liên tục',best:'Kỷ lục: {count} ngày',goal:'{count} phút'},
  en:{kicker:"Today's goal",minutes:'{done} / {goal} min',streak:'🔥 {count}-day streak',best:'Best: {count} days',goal:'{count} min'},
  zh:{kicker:'今日目标',minutes:'{done} / {goal} 分钟',streak:'🔥 连续 {count} 天',best:'最佳：{count} 天',goal:'{count} 分钟'},
  ja:{kicker:'今日の目標',minutes:'{done} / {goal} 分',streak:'🔥 {count}日連続',best:'最長：{count}日',goal:'{count} 分'},
  ru:{kicker:'Цель на сегодня',minutes:'{done} / {goal} мин',streak:'🔥 Серия: {count} дн.',best:'Рекорд: {count} дн.',goal:'{count} мин'},
  pt:{kicker:'Meta de hoje',minutes:'{done} / {goal} min',streak:'🔥 {count} dias seguidos',best:'Recorde: {count} dias',goal:'{count} min'},
  'pt-BR':{kicker:'Meta de hoje',minutes:'{done} / {goal} min',streak:'🔥 {count} dias seguidos',best:'Recorde: {count} dias',goal:'{count} min'},
  ar:{kicker:'هدف اليوم',minutes:'{done} / {goal} دقيقة',streak:'🔥 {count} أيام متتالية',best:'الأفضل: {count} أيام',goal:'{count} دقيقة'},
  ms:{kicker:'Matlamat hari ini',minutes:'{done} / {goal} minit',streak:'🔥 {count} hari berturut-turut',best:'Rekod: {count} hari',goal:'{count} minit'}
};
function currentDailyGoalUi() { return dailyGoalUi[activeLanguage] || dailyGoalUi.en; }
function localizedLessonName(index) { return activeLanguage === 'vi' ? lessons[index][0] : `${siteLanguages[activeLanguage]?.basic || 'Lesson'} ${index + 1}`; }
const rows = [['`','1','2','3','4','5','6','7','8','9','0','-','=','Back'],['Tab','q','w','e','r','t','y','u','i','o','p','[',']','\\'],['Caps','a','s','d','f','g','h','j','k','l',';','\'','Enter'],['Shift','z','x','c','v','b','n','m',',','.','/','Shift'],['Ctrl','Alt',' ' ,'Alt','Ctrl']];
const fingerMap = {q:'LP',a:'LP',z:'LP',w:'LR',s:'LR',x:'LR',e:'LM',d:'LM',c:'LM',r:'LI',f:'LI',v:'LI',t:'LI',g:'LI',b:'LI',y:'RI',h:'RI',n:'RI',u:'RI',j:'RI',m:'RI',i:'RM',k:'RM',',':'RM',o:'RR',l:'RR','.':'RR',p:'RP',';':'RP','/':'RP',' ':'LT',enter:'RP'};

/* =================================================================================================
   TRANG CHỦ (Phase 3) — engine 30 bài cũ đã ra khỏi đây.
   Trang chủ giờ chỉ còn bốn khối: hero (gõ thử HOẶC continue card) → unit đang học →
   3 lối tắt → 3 card SEO. Mọi thứ khác đã có nhà riêng:
     bài học        → /hoc/ (player, hash route)          — player.js
     lộ trình 35 bài→ /bai-hoc/                            — bai-hoc/curriculum-page.js
     thành tích     → /tien-do/ (bảng, heatmap, coach)     — tien-do/progress-page.js
     luyện tự do    → /luyen-tu-do/                        — luyen-tu-do/free-page.js
   Vì thế file này KHÔNG còn truy cập #typing-input, #free-input, #game-input, #keyboard,
   #results-body, .mode-switch, .stats, #lesson-levels... Các bảng chuỗi phía trên được giữ
   nguyên theo DECISIONS.md quyết định 4 (còn bật lại được), phần nào còn dùng thì dùng.

   Tiến độ đọc từ `typingease-progress-v3` qua TypingEaseProgress — KHÔNG còn đọc
   `goxanh-lesson-records-v2`. Người chỉ có dữ liệu cũ được xử lý theo quyết định 5:
   một dòng "đã hoàn thành n bài ở giáo trình cũ", Unit 1-2 mở, không map từng bài.
================================================================================================= */

const curriculum = window.TypingEaseCurriculum || null;
const store = window.TypingEaseProgress || null;
const profile = window.TypingEaseProfile || null;

const homepageLocale = /(?:^|\/)(en|ja)(?:\/|$)/.exec(location.pathname)?.[1] || '';
const isLocalizedHomepage = Boolean(homepageLocale);
const isEnglishHomepage = homepageLocale === 'en';
const base = isLocalizedHomepage ? '../' : './';
const TEST_URL = isLocalizedHomepage ? './typing-test/' : './kiem-tra-toc-do-go/';
const CURRICULUM_URL = `${base}bai-hoc/`;
const PROGRESS_URL = `${base}tien-do/`;
const FREE_URL = `${base}luyen-tu-do/`;
const WEAK_URL = `${base}luyen-phim-yeu/`;
const GUIDE_URL = isEnglishHomepage ? './how-to-type-faster/' : homepageLocale === 'ja' ? './touch-typing/' : './cach-go-10-ngon/';
const lessonUrl = (lessonId, screen) => `${base}hoc/#${lessonId}/${screen}`;
const MARK = ['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩','⑪','⑫'];

const homeUi = {
  vi: {
    nav: ['Luyện gõ', 'Lộ trình', 'Tiến độ', 'Kiểm tra tốc độ'],
    roadmapKicker: 'Giáo trình {total} bài · {units} unit',
    roadmapAll: 'Xem tất cả {total} bài →',
    unitTitle: 'Unit {index} · {title}',
    unitDone: '{done}/{total} bài ✓',
    railDone: '✓',
    railSoon: 'Sắp có',
    railNote: 'Nội dung các unit sau đang được viết — bài chưa mở hiện mờ và chưa bấm được.',
    teaser: 'Unit {index} · {title} ({count} bài)',
    teaserLocked: '🔒',
    shortcutsTitle: 'Luyện thêm',
    shortcuts: [
      ['Kiểm tra tốc độ', 'Đo WPM và độ chính xác trong 15 · 30 · 60 · 120 giây.'],
      ['Luyện phím yếu', 'Bài tập sinh riêng từ những phím bạn hay sai nhất.'],
      ['Luyện tự do', 'Dán đoạn văn của bạn và gõ lại theo cách bạn muốn.']
    ],
    continueKicker: 'TIẾP TỤC',
    continueName: 'Bài {n} · {title}',
    continueCount: 'Unit {unit} · screen {screen}/{screens}',
    continueGo: '▶ Tiếp tục (Enter)',
    continueRedo: '↻ Làm lại bài {n}',
    continueMap: 'Xem lộ trình',
    streak: '🔥 {days} ngày · {minutes} phút hôm nay',
    coachWeak: 'Coach: phím <b>{keys}</b> đang kéo bạn xuống — luyện riêng 1 phút?',
    legacy: 'Đã hoàn thành {n} bài ở giáo trình cũ — Unit 1 và Unit 2 đã mở cho bạn.',
    doneKicker: 'DUY TRÌ PHONG ĐỘ',
    doneName: 'Bạn đã xong hết phần đã có nội dung',
    doneCount: 'Giữ nhịp bằng bài kiểm tra, phím yếu hoặc luyện tự do.',
    doneGo: '▶ Kiểm tra tốc độ (Enter)',
    exploreKicker: 'Tài nguyên TypingEase',
    footer: 'Gõ chậm một chút, rồi bạn sẽ đi rất xa.',
    contentVi: ''
  },
  en: {
    nav: ['Practice', 'Curriculum', 'Progress', 'Speed test'],
    roadmapKicker: '{total}-lesson curriculum · {units} units',
    roadmapAll: 'See all {total} lessons →',
    unitTitle: 'Unit {index} · {title}',
    unitDone: '{done}/{total} lessons ✓',
    railDone: '✓',
    railSoon: 'Soon',
    railNote: 'Later units are still being written — lessons without content are dimmed.',
    teaser: 'Unit {index} · {title} ({count} lessons)',
    teaserLocked: '🔒',
    shortcutsTitle: 'Practise more',
    shortcuts: [
      ['Speed test', 'Measure WPM and accuracy over 15 · 30 · 60 · 120 seconds.'],
      ['Weak-key drill', 'A drill built from the keys you miss most often.'],
      ['Free typing', 'Paste your own text and type it back at your own pace.']
    ],
    continueKicker: 'CONTINUE',
    continueName: 'Lesson {n} · {title}',
    continueCount: 'Unit {unit} · screen {screen}/{screens}',
    continueGo: '▶ Continue (Enter)',
    continueRedo: '↻ Redo lesson {n}',
    continueMap: 'See the curriculum',
    streak: '🔥 {days} days · {minutes} min today',
    coachWeak: 'Coach: <b>{keys}</b> are holding you back — drill them for a minute?',
    legacy: 'You finished {n} lessons in the old curriculum — Units 1 and 2 are unlocked for you.',
    doneKicker: 'KEEP IT UP',
    doneName: 'You have finished everything with content',
    doneCount: 'Keep the rhythm with a test, a weak-key drill or free typing.',
    doneGo: '▶ Take the speed test (Enter)',
    exploreKicker: 'TypingEase resources',
    footer: 'Type a little slower and you will go a long way.',
    contentVi: 'Lesson content is Vietnamese for now; the English lessons come next.'
  },
  ja: {
    nav: ['タイピング練習', 'カリキュラム', '記録', 'スピードテスト'],
    roadmapKicker: '全 {total} レッスン · {units} ユニット',
    roadmapAll: '全 {total} レッスンを見る →',
    unitTitle: 'ユニット {index} · {title}',
    unitDone: '{done}/{total} レッスン ✓',
    railDone: '✓',
    railSoon: '準備中',
    railNote: '後半のユニットは制作中です。内容のないレッスンは淡色で表示されます。',
    teaser: 'ユニット {index} · {title}（{count} レッスン）',
    teaserLocked: '🔒',
    shortcutsTitle: 'もっと練習',
    shortcuts: [
      ['スピードテスト', '15 · 30 · 60 · 120 秒で WPM と正確率を測ります。'],
      ['苦手なキーの練習', 'よく間違えるキーから自動で作る練習です。'],
      ['自由入力', '好きな文章を貼って、自分のペースで打てます。']
    ],
    continueKicker: '続ける',
    continueName: 'レッスン {n} · {title}',
    continueCount: 'ユニット {unit} · スクリーン {screen}/{screens}',
    continueGo: '▶ 続ける (Enter)',
    continueRedo: '↻ レッスン {n} をやり直す',
    continueMap: 'カリキュラムを見る',
    streak: '🔥 {days} 日連続 · 今日 {minutes} 分',
    coachWeak: 'コーチ: <b>{keys}</b> が足を引っ張っています — 1分だけ練習しませんか？',
    legacy: '旧カリキュラムで {n} レッスン完了済み — ユニット 1・2 は解放されています。',
    doneKicker: '調子を保つ',
    doneName: '内容があるレッスンはすべて終わりました',
    doneCount: 'テストや苦手キー練習、自由入力でリズムを保ちましょう。',
    doneGo: '▶ スピードテスト (Enter)',
    exploreKicker: 'TypingEase の記事',
    footer: 'ゆっくり打てば、遠くまで行けます。',
    contentVi: 'レッスン本文は現在ベトナム語です。日本語版はこの後で用意します。'
  }
};
function currentHomeUi() { return homeUi[activeLanguage] || homeUi.en; }
const escapeHtml = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const localDateKey = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/* --- đọc giáo trình + tiến độ ------------------------------------------------------------------ */
const sequence = curriculum?.sequence || [];
const lessonInfo = lessonId => curriculum?.lessons?.[lessonId] || null;
const isReady = lessonId => Boolean(lessonInfo(lessonId)?.ready);
const unitOf = lessonId => curriculum?.units.find(unit => unit.groups.some(group => group.lessons.includes(lessonId))) || null;
const unitLessons = unit => unit.groups.flatMap(group => group.lessons);
const screensDone = lessonId => Object.keys(store?.getLesson(lessonId)?.screens || {}).length;

function isLessonDone(lessonId) {
  const lesson = store?.getLesson(lessonId);
  if (!lesson) return false;
  const total = lessonInfo(lessonId)?.screens || 0;
  return Boolean(lesson.completedAt) || (total > 0 && screensDone(lessonId) >= total);
}

// "Bài đang dở" = `current` của store nếu bài đó còn dở, nếu không thì bài ready đầu tiên chưa xong.
function resolveContinue() {
  if (!curriculum || !store) return null;
  const saved = store.getCurrent();
  if (saved && isReady(saved.lessonId) && !isLessonDone(saved.lessonId)) {
    const total = lessonInfo(saved.lessonId).screens || saved.screen;
    return { lessonId: saved.lessonId, screen: Math.min(Math.max(1, saved.screen), total) };
  }
  const next = sequence.find(lessonId => isReady(lessonId) && !isLessonDone(lessonId));
  return next ? { lessonId: next, screen: 1 } : null;
}

// Người quay lại phải có tiến độ THẬT. Chỉ gõ thử dòng hero rồi bỏ đi (attempt kind:'free')
// không tính — nếu tính thì lần sau họ mất luôn ô gõ thử mà chưa từng vào bài nào.
function isReturning() {
  if (!store) return false;
  const state = store.getState();
  if (state.current || Object.keys(state.lessons).length > 0 || state.legacyCompleted > 0) return true;
  return (profile?.getState().attempts || []).some(item => item.kind === 'lesson' || item.kind === 'weak');
}

/* --- continue card ----------------------------------------------------------------------------- */
let continueHref = '';

function renderContinueCard() {
  const card = document.querySelector('#continue-card');
  if (!card) return;
  const returning = isReturning();
  document.body.classList.toggle('is-returning', returning);
  card.hidden = !returning;
  if (!returning) { continueHref = ''; return; }

  const ui = currentHomeUi();
  const target = resolveContinue();
  card.querySelector('#continue-kicker').textContent = target ? ui.continueKicker : ui.doneKicker;

  if (target) {
    const info = lessonInfo(target.lessonId);
    const unit = unitOf(target.lessonId);
    const number = sequence.indexOf(target.lessonId) + 1;
    const total = info.screens || 1;
    continueHref = lessonUrl(target.lessonId, target.screen);
    card.querySelector('#continue-name').textContent = formatUi(ui.continueName, { n: number, title: info.title });
    card.querySelector('#continue-count').textContent = formatUi(ui.continueCount, {
      unit: unit ? unit.index : '?', screen: target.screen, screens: total
    });
    const track = card.querySelector('#continue-track');
    const ratio = Math.round(Math.min(1, (target.screen - 1) / total) * 100);
    track.style.setProperty('--continue-progress', `${ratio}%`);
    track.setAttribute('aria-valuenow', String(ratio));
  } else {
    continueHref = TEST_URL;
    card.querySelector('#continue-name').textContent = ui.doneName;
    card.querySelector('#continue-count').textContent = ui.doneCount;
    const track = card.querySelector('#continue-track');
    track.style.setProperty('--continue-progress', '100%');
    track.setAttribute('aria-valuenow', '100');
  }
  card.querySelector('#continue-go').textContent = target ? ui.continueGo : ui.doneGo;

  // "Làm lại bài" chỉ có nghĩa khi đã xong ít nhất một bài.
  const redo = card.querySelector('#continue-redo');
  const lastDone = sequence.filter(isLessonDone).pop();
  redo.hidden = !lastDone;
  if (lastDone) {
    redo.href = lessonUrl(lastDone, 1);
    redo.textContent = formatUi(ui.continueRedo, { n: sequence.indexOf(lastDone) + 1 });
  }
  card.querySelector('#continue-map').textContent = ui.continueMap;
  card.querySelector('#continue-map').href = CURRICULUM_URL;

  const daily = store.loadDaily();
  const dayKey = localDateKey();
  const minutesToday = Math.floor((daily.days[dayKey]?.practiceSeconds || 0) / 60);
  const streak = card.querySelector('#continue-streak');
  streak.textContent = formatUi(ui.streak, { days: daily.currentStreak, minutes: minutesToday });
  streak.hidden = daily.currentStreak === 0 && minutesToday === 0;

  // Gợi ý của coach là dòng phụ, không bao giờ thay chỗ hành động chính.
  const nudge = card.querySelector('#continue-coach');
  const weak = (profile?.getWeakKeys(3) || []).filter(item => item.attempts >= profile.KEY_SAMPLE_FLOOR && item.accuracy < 92);
  nudge.hidden = weak.length === 0;
  if (weak.length)
    nudge.innerHTML = formatUi(ui.coachWeak, { keys: escapeHtml(weak.map(item => item.key.toUpperCase()).join(', ')) });

  // Quyết định 5: chỉ nói con số của giáo trình cũ, không dựng tiến độ giả.
  const legacyEl = card.querySelector('#continue-legacy');
  const legacy = store.legacyCompleted();
  legacyEl.hidden = legacy === 0;
  if (legacy > 0) legacyEl.textContent = formatUi(ui.legacy, { n: legacy });
}

function goContinue() {
  if (continueHref) { location.href = continueHref; return; }
  const target = resolveContinue();
  location.href = target ? lessonUrl(target.lessonId, target.screen) : `${base}hoc/`;
}

/* --- rail: unit đang học ------------------------------------------------------------------------ */
function renderRail() {
  const rail = document.querySelector('#unit-rail');
  if (!rail || !curriculum) return;
  const ui = currentHomeUi();
  const target = resolveContinue();
  const unit = (target && unitOf(target.lessonId)) || curriculum.units[0];
  const ids = unitLessons(unit);
  const done = ids.filter(isLessonDone).length;

  document.querySelector('#roadmap-kicker').innerHTML =
    `<i></i> ${escapeHtml(formatUi(ui.roadmapKicker, { total: sequence.length, units: curriculum.units.length }))}`;
  document.querySelector('#roadmap-title').textContent = formatUi(ui.unitTitle, { index: unit.index, title: unit.title });
  document.querySelector('#roadmap-summary').textContent = unit.summary;
  document.querySelector('#roadmap-count').textContent = formatUi(ui.unitDone, { done, total: ids.length });
  const all = document.querySelector('#roadmap-all');
  all.textContent = formatUi(ui.roadmapAll, { total: sequence.length });
  all.href = CURRICULUM_URL;

  rail.innerHTML = ids.map((lessonId, index) => {
    const info = lessonInfo(lessonId);
    if (!info) return '';
    const lessonDone = isLessonDone(lessonId);
    const active = Boolean(target && target.lessonId === lessonId);
    const label = `<b>${MARK[index] || index + 1}</b><span>${escapeHtml(info.title)}</span>`;
    // Bài chưa có nội dung không được là link: /hoc/ chỉ hiện "chưa mở", dẫn vào đó là dẫn vào
    // chỗ trống. Nó vẫn phải NHÌN THẤY được để người dùng biết lộ trình đi tới đâu.
    if (!info.ready)
      return `<span class="rail-chip is-soon" aria-disabled="true">${label}<em>${escapeHtml(ui.railSoon)}</em></span>`;
    const state = active ? '▶' : lessonDone ? ui.railDone : '';
    const screen = active ? target.screen : 1;
    return `<a class="rail-chip${lessonDone ? ' is-done' : ''}${active ? ' is-current' : ''}"`
      + ` href="${lessonUrl(lessonId, screen)}">${label}<em>${escapeHtml(state)}</em></a>`;
  }).join('');

  const note = document.querySelector('#rail-note');
  const soon = ids.filter(lessonId => !isReady(lessonId)).length;
  const extra = ui.contentVi ? ` ${ui.contentVi}` : '';
  note.hidden = soon === 0 && !ui.contentVi;
  note.textContent = `${soon ? ui.railNote : ''}${extra}`.trim();

  const teasers = document.querySelector('#unit-teasers');
  teasers.innerHTML = curriculum.units.filter(other => other.id !== unit.id).map(other => {
    const count = unitLessons(other).length;
    const locked = !store?.isUnlocked(other.id);
    return `<li><a href="${CURRICULUM_URL}#${other.id}">`
      + `${escapeHtml(formatUi(ui.teaser, { index: other.index, title: other.title, count }))}`
      + `${locked ? ` ${ui.teaserLocked}` : ''}</a></li>`;
  }).join('');
}

/* --- lối tắt ----------------------------------------------------------------------------------- */
function renderShortcuts() {
  const ui = currentHomeUi();
  const title = document.querySelector('#shortcuts-title');
  if (title) title.textContent = ui.shortcutsTitle;
  [['#sc-test', TEST_URL], ['#sc-weak', WEAK_URL], ['#sc-free', FREE_URL]].forEach(([selector, href], index) => {
    const card = document.querySelector(selector);
    if (!card) return;
    card.href = href;
    const [name, text] = ui.shortcuts[index];
    card.querySelector('.sc-title').textContent = name;
    card.querySelector('.sc-text').textContent = text;
  });
}

/* --- i18n cho phần còn lại của trang ----------------------------------------------------------- */
// Không còn một selector theo THỨ TỰ nào ở đây (DECISIONS.md cạm bẫy 3): mọi phần tử được gọi
// bằng id hoặc bằng vòng lặp trên chính danh sách của nó, nên thêm/bớt markup không làm lệch i18n.
function applyLanguage(code) {
  const t = siteLanguages[code] || siteLanguages.vi;
  activeLanguage = code;
  const ui = currentHomeUi();
  document.documentElement.lang = code;
  document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr';

  const navLinks = [...document.querySelectorAll('.topbar nav a')];
  navLinks.forEach((link, index) => { if (ui.nav[index]) link.textContent = ui.nav[index]; });

  if (!isLocalizedHomepage) {
    document.querySelector('h1').innerHTML = `${t.hero[0]}<br><em>${t.hero[1]}</em>`;
    document.querySelector('.intro').textContent = t.intro;
    document.title = code === 'vi' ? 'Luyện gõ 10 ngón online miễn phí | TypingEase' : 'TypingEase — Touch typing practice';
  }

  const exploreKicker = document.querySelector('#explore-kicker');
  if (exploreKicker) exploreKicker.innerHTML = `<i></i> ${escapeHtml(ui.exploreKicker)}`;
  const exploreTitle = document.querySelector('#explore-title');
  const localized = currentLocalizedUi();
  if (exploreTitle && localized.exploreTitle) exploreTitle.textContent = localized.exploreTitle;
  document.querySelectorAll('.explore-card').forEach((card, index) => {
    const copy = localized.explore?.[index];
    if (!copy) return;
    const [title, description, cta] = copy;
    card.querySelector('h3').textContent = title;
    card.querySelector('p').textContent = description;
    card.querySelector('span').childNodes[0].nodeValue = `${cta} `;
  });
  const footerNote = document.querySelector('footer p');
  if (footerNote) footerNote.textContent = ui.footer;

  renderShortcuts();
  renderContinueCard();
  renderRail();
  // Ghi lại lựa chọn cuối (chỉ để tham khảo — ngôn ngữ hiển thị do URL quyết định, xem phần boot).
  try { localStorage.setItem('typingease-language', code); } catch { /* storage blocked */ }
  // taster.js nghe event này để đổi chuỗi của widget gõ thử.
  document.dispatchEvent(new CustomEvent('typingease:language', { detail: { language: code } }));
}

/* --- điều hướng ------------------------------------------------------------------------------- */
// #bang-xep-hang và #huong-dan từng là section trên trang chủ và vẫn được link từ ngoài.
// Chúng không còn tồn tại ở đây, nên chuyển tiếp sang nhà mới thay vì để người dùng rơi vào khoảng trắng.
const LEGACY_HASH = { '#bang-xep-hang': () => PROGRESS_URL, '#huong-dan': () => GUIDE_URL, '#thanh-tich': () => PROGRESS_URL };
function followLegacyHash() {
  const resolve = LEGACY_HASH[location.hash];
  if (resolve) location.replace(resolve());
}
window.addEventListener('hashchange', followLegacyHash);

const languageSelect = document.querySelector('#language');
languageSelect?.addEventListener('change', event => {
  if (event.target.value === 'vi' && homepageLocale) { location.href = '../'; return; }
  if (event.target.value === 'en' && homepageLocale !== 'en') { location.href = homepageLocale ? '../en/' : './en/'; return; }
  if (event.target.value === 'ja' && homepageLocale !== 'ja') { location.href = homepageLocale ? '../ja/' : './ja/'; return; }
  applyLanguage(event.target.value);
});

const continueCard = document.querySelector('#continue-card');
if (continueCard) {
  continueCard.querySelector('#continue-go').addEventListener('click', event => { event.stopPropagation(); goContinue(); });
  continueCard.addEventListener('click', event => { if (!event.target.closest('a,button')) goContinue(); });
  // Enter bất kỳ đâu trên trang chủ = tiếp tục, trừ khi người dùng đang ở trong một ô nhập.
  document.addEventListener('keydown', event => {
    if (event.key !== 'Enter' || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
    if (continueCard.hidden) return;
    const active = document.activeElement;
    if (active && (active.isContentEditable || active.closest('input,textarea,select,a,button'))) return;
    event.preventDefault();
    goContinue();
  });
}

/* --- API cho taster.js ------------------------------------------------------------------------- */
// CTA của ô gõ thử: ghi công dòng vừa gõ (nó ĐÚNG là screen `starter.screen` của bài đầu tiên,
// đánh số từ 1) rồi mở player ở screen kế tiếp — /hoc/#u1-l01/7 với dữ liệu hiện tại.
// recordScreen() nhận index 0-based nên phải tự trừ 1 (DECISIONS.md quyết định 3).
function startFromTaster(result = {}) {
  const starter = curriculum?.starter;
  if (!starter || !store) { location.href = `${base}hoc/`; return; }
  const accuracy = Number(result.accuracy);
  const wpm = Number(result.wpm);
  const seconds = Number(result.seconds);
  const stars = !Number.isFinite(accuracy) ? 0 : accuracy >= 98 ? 3 : accuracy >= 94 ? 2 : accuracy >= 70 ? 1 : 0;
  store.recordScreen(starter.lessonId, starter.screen - 1, {
    type: 'block',
    stars,
    maxStars: 3,
    wpm: Number.isFinite(wpm) ? wpm : null,
    accuracy: Number.isFinite(accuracy) ? accuracy : null,
    seconds: Number.isFinite(seconds) ? seconds : 0
  });
  const nextScreen = starter.screen + 1;
  store.setCurrent(starter.lessonId, nextScreen);
  location.href = lessonUrl(starter.lessonId, nextScreen);
}

window.TypingEaseHome = {
  startFromTaster,
  goContinue,
  continueTarget: resolveContinue,
  curriculumUrl: () => CURRICULUM_URL,
  testUrl: () => TEST_URL,
  lessonCount: () => sequence.length
};

/* --- boot -------------------------------------------------------------------------------------- */
followLegacyHash();
// URL quyết định ngôn ngữ: `/` là vi, `/en/` là en, `/ja/` là ja — cả ba đều có URL riêng,
// canonical riêng và hreflang riêng. Trước đây `/` còn đọc `typingease-language` và tự đổi mặt
// sang en/ja, nghĩa là URL vi hiển thị nội dung Nhật; giờ dropdown điều hướng chứ không "khoác áo".
const startLanguage = homepageLocale || 'vi';
if (languageSelect) languageSelect.value = startLanguage;
applyLanguage(startLanguage);
window.addEventListener('pagehide', () => profile?.save());
