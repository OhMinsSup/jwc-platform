export function playHtml() {
	return `
    <!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>사사기 19장: 기브아의 그림자 - 인터랙티브 리포트</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;600;700&family=Noto+Sans+KR:wght@300;400;500;700&display=swap" rel="stylesheet">
    <!-- Chosen Palette: Ancient Scroll (Shades of beige like #F5F5DC, dark brown for text like #5D4037, charcoal for accents, and a muted red/rust for highlights) -->
    <!-- Application Structure Plan: A single-page, vertical scrolling narrative application. The structure follows the chronological and investigative flow of the game: 1. Introduction, 2. The Journey (interactive cards), 3. The Night in Gibeah (dark-themed section with modals for key events), 4. Reconstructing the Truth (interactive timeline puzzle), and 5. Final Analysis (accordion UI). This narrative structure was chosen to maximize user immersion and emotional impact, guiding the user through the tragic story step-by-step, mirroring the source game's design for optimal understanding. -->
    <!-- Visualization & Content Choices:
        - Report Info: Story of the Levite. Goal: Storytelling. Method: Interactive HTML cards and modals (JS show/hide). Justification: Engages user in the narrative flow.
        - Report Info: Sequence of events. Goal: Organize/Analyze. Method: Custom interactive timeline puzzle (HTML/CSS/JS click-sequence validation). Justification: Core interactive element that tests and reinforces user's understanding of the event chronology, directly adapted from the source game's final puzzle.
        - Report Info: Root causes. Goal: Inform/Analyze. Method: Accordion UI (HTML/CSS/JS). Justification: Presents final conclusions in a structured and digestible format without cluttering the UI.
        - All elements are implemented without SVG or Mermaid JS, using standard web technologies as required. -->
    <!-- CONFIRMATION: NO SVG graphics used. NO Mermaid JS used. -->
    <style>
        body {
            font-family: 'Noto Sans KR', sans-serif;
            background-color: #FDFBF5;
            color: #4A4A4A;
        }
        h1, h2, h3 {
            font-family: 'Noto Serif KR', serif;
            font-weight: 700;
        }
        .font-serif-kr {
            font-family: 'Noto Serif KR', serif;
        }
        .font-sans-kr {
            font-family: 'Noto Sans KR', sans-serif;
        }
        .timeline-item {
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .timeline-item.selected {
            transform: scale(1.05);
            box-shadow: 0 0 15px rgba(206, 126, 92, 0.5);
            border-color: #CE7E5C;
        }
        .timeline-item.correct {
            background-color: #E8F5E9;
            border-color: #4CAF50;
        }
        .timeline-item.incorrect {
            background-color: #FFEBEE;
            border-color: #F44336;
        }
        .accordion-content {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.5s ease-out;
        }
        /* Background for sections using placeholder images */
        #section-journey {
            background-image: url('https://placehold.co/1200x600/D3C9B5/6D5A50?text=%EC%97%AC%EC%A0%95%EC%9D%98+%EC%8B%9C%EC%9E%91'); /* Lighter, more open background */
            background-size: cover;
            background-position: center;
            background-attachment: fixed; /* Parallax effect */
            padding: 5rem 0; /* Add padding for content spacing */
            border-radius: 1rem;
        }
        #section-gibeah {
            background-image: url('https://placehold.co/1200x600/37474F/AAB7B8?text=%EA%B8%B0%EB%B8%8C%EC%95%84%EC%9D%98+%EB%B0%A4'); /* Darker, mysterious background */
            background-size: cover;
            background-position: center;
            background-attachment: fixed; /* Parallax effect */
            padding: 5rem 0; /* Add padding for content spacing */
            border-radius: 1rem;
        }
        /* Overlay for text readability on background images */
        #section-journey > *:not(h2, p), #section-gibeah > *:not(h2, p) {
            position: relative;
            z-index: 10;
        }
        #section-journey::before, #section-gibeah::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(255, 255, 255, 0.5); /* Semi-transparent white overlay */
            border-radius: 1rem;
            z-index: 0;
        }
        #section-gibeah::before {
            background-color: rgba(0, 0, 0, 0.4); /* Semi-transparent dark overlay */
        }
        .interactive-card {
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease-in-out;
            transform: translateY(0);
        }
        .interactive-card:hover {
            transform: translateY(-5px) scale(1.02);
            box-shadow: 0 10px 15px rgba(0, 0, 0, 0.2);
        }
        .modal-btn {
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease-in-out;
            transform: translateY(0);
        }
        .modal-btn:hover {
            transform: translateY(-3px) scale(1.01);
            box-shadow: 0 8px 12px rgba(0, 0, 0, 0.2);
        }
    </style>
</head>
<body class="bg-[#FDFBF5]">

    <header class="text-center py-16 md:py-24 bg-[#EAE3D3] border-b-4 border-[#D3C9B5] relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-t from-transparent to-black opacity-10"></div>
        <div class="container mx-auto px-4 relative z-10">
            <h1 class="text-4xl md:text-6xl text-[#5D4037] mb-4">사사기 19장: 기브아의 그림자</h1>
            <p class="text-lg md:text-xl text-[#6D5A50] italic max-w-3xl mx-auto">"그때에는 이스라엘에 왕이 없으므로 사람이 각기 자기의 소견에 옳은 대로 행하였더라." (사사기 21:25)</p>
            <button id="start-btn" class="mt-8 bg-[#8D6E63] text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-[#795548] transition-all duration-300 transform hover:-translate-y-1">조사 시작</button>
        </div>
    </header>

    <main id="main-content" class="container mx-auto p-4 md:p-8 space-y-16 md:space-y-24">
        
        <section id="section-journey" class="opacity-0 translate-y-10 transition-all duration-1000 relative">
            <div class="relative z-10">
                <h2 class="text-3xl md:text-4xl text-center text-[#5D4037] mb-8">1. 여정의 시작</h2>
                <p class="text-center max-w-3xl mx-auto mb-12 text-[#6D5A50]">한 레위 사람과 그의 첩이 유다 베들레헴을 떠나 고향으로 돌아가는 여정은 시작부터 순탄치 않았습니다. 아래 카드들을 클릭하여 그들이 어떤 길을 선택했는지 확인해보세요.</p>
                <div class="grid md:grid-cols-3 gap-8">
                    <div class="interactive-card bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer border border-gray-200">
                        <h3 class="text-xl font-bold mb-3 text-[#5D4037]">지연된 출발 <span class="float-right text-2xl">⏳</span></h3>
                        <div class="card-content hidden">
                            <p class="text-gray-700">레위인은 베들레헴에 있는 장인의 집을 떠나려 했으나, 장인의 간곡한 만류로 며칠을 더 머물게 됩니다. 결국 해가 저물 무렵이 되어서야 늦게 출발하게 됩니다.</p>
                            <p class="mt-4 text-sm text-[#8D6E63] italic">"사랑하는 사위와 딸아, 떠나려 하나 며칠 더 머물며 극진히 대접하니, 해 질 녘이 되어 떠나거라. 이방인의 땅은 피하거라."</p>
                        </div>
                    </div>
                    <div class="interactive-card bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer border border-gray-200">
                        <h3 class="text-xl font-bold mb-3 text-[#5D4037]">이방의 성읍 <span class="float-right text-2xl">🚧</span></h3>
                        <div class="card-content hidden">
                            <p class="text-gray-700">해가 질 무렵, 일행은 이방 민족인 여부스 족이 사는 예루살렘 근처에 이릅니다. 종은 그곳에서 하룻밤 묵자고 제안하지만, 레위인은 이를 거절합니다.</p>
                            <p class="mt-4 text-sm text-[#8D6E63] italic">"이방인의 성읍, 여부스는 피해야 할 곳. 동쪽으로 발걸음을 옮겨라."</p>
                        </div>
                    </div>
                    <div class="interactive-card bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer border border-gray-200">
                        <h3 class="text-xl font-bold mb-3 text-[#5D4037]">기브아를 향하여 <span class="float-right text-2xl">➡️</span></h3>
                        <div class="card-content hidden">
                            <p class="text-gray-700">레위인은 동족인 베냐민 지파의 성읍 기브아에서 밤을 보내기로 결정합니다. 그는 동족의 땅에서 안전과 환대를 기대하며 발걸음을 옮깁니다.</p>
                            <p class="mt-4 text-sm text-[#8D6E63] italic">"이스라엘 자손의 땅, 베냐민 지파 기브아에서 밤을 지내리라."</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section id="section-gibeah" class="opacity-0 translate-y-10 transition-all duration-1000 relative text-white">
            <div class="relative z-10">
                <h2 class="text-3xl md:text-4xl text-center mb-8">2. 기브아의 밤</h2>
                <p class="text-center max-w-3xl mx-auto mb-12 text-gray-300">기대에 부풀어 도착한 기브아. 그러나 그들을 맞이한 것은 따뜻한 환대가 아닌 차가운 외면과 끔찍한 악의였습니다. 그날 밤, 인간의 존엄성이 무너져 내렸습니다.</p>
                <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                    <button data-modal="modal-rejection" class="modal-btn bg-gray-700 hover:bg-gray-600 p-4 rounded-lg transition-colors transform hover:-translate-y-1">차가운 외면 <span class="float-right text-2xl">🚫</span></button>
                    <button data-modal="modal-hospitality" class="modal-btn bg-gray-700 hover:bg-gray-600 p-4 rounded-lg transition-colors transform hover:-translate-y-1">노인의 호의 <span class="float-right text-2xl">🤝</span></button>
                    <button data-modal="modal-attack" class="modal-btn bg-gray-700 hover:bg-gray-600 p-4 rounded-lg transition-colors transform hover:-translate-y-1">불량배들의 습격 <span class="float-right text-2xl">💢</span></button>
                    <button data-modal="modal-tragedy" class="modal-btn bg-red-800 hover:bg-red-700 p-4 rounded-lg transition-colors transform hover:-translate-y-1">비극적 결말 <span class="float-right text-2xl">💔</span></button>
                </div>
            </div>
        </section>
        
        <section id="section-reconstruction" class="opacity-0 translate-y-10 transition-all duration-1000">
            <h2 class="text-3xl md:text-4xl text-center text-[#5D4037] mb-8">3. 진실의 재구성</h2>
            <p class="text-center max-w-3xl mx-auto mb-12 text-[#6D5A50]">사건의 조각들이 흩어져 있습니다. 아래 사건들을 시간 순서에 맞게 클릭하여 그날 밤의 진실을 재구성해 보세요. 순서대로 6개의 사건을 모두 선택해야 합니다.</p>
            <div id="timeline-puzzle" class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <!-- Timeline items will be injected here by JS -->
            </div>
            <div class="text-center">
                <button id="timeline-reset" class="bg-gray-500 text-white font-bold py-2 px-6 rounded-lg shadow-md hover:bg-gray-600 transition-colors transform hover:-translate-y-1">초기화</button>
            </div>
            <p id="timeline-feedback" class="text-center mt-4 h-6 font-bold"></p>
        </section>

        <section id="section-analysis" class="hidden opacity-0 translate-y-10 transition-all duration-1000">
            <h2 class="text-3xl md:text-4xl text-center text-[#5D4037] mb-8">4. 비극의 근본 원인</h2>
             <p class="text-center max-w-3xl mx-auto mb-12 text-[#6D5A50]">기브아의 비극은 단순한 우발적 사건이 아니었습니다. 그 이면에는 당시 이스라엘 사회를 병들게 한 깊은 원인들이 자리 잡고 있었습니다.</p>
            <div class="max-w-3xl mx-auto space-y-4">
                <div class="accordion-item border rounded-lg overflow-hidden">
                    <button class="accordion-header w-full text-left p-4 bg-white font-bold text-lg text-[#5D4037] flex justify-between items-center hover:bg-gray-50 transition-colors">
                        <span>원인 1: 극심한 도덕적 타락과 질서의 부재</span>
                        <span class="transform transition-transform duration-300">▼</span>
                    </button>
                    <div class="accordion-content bg-gray-50">
                        <div class="p-4 text-gray-700">
                            <p>"왕이 없으므로" 라는 구절이 상징하듯, 당시 이스라엘 사회에는 올바른 기준을 제시하고 사회를 통합할 구심점이 없었습니다. 기브아 사람들이 나그네를 환대하지 않고 외면한 것, 불량배들이 거리낌 없이 극악무도한 범죄를 저지른 것은 사회 전체의 도덕적 해이와 질서 붕괴가 얼마나 심각했는지를 보여줍니다.</p>
                        </div>
                    </div>
                </div>
                <div class="accordion-item border rounded-lg overflow-hidden">
                    <button class="accordion-header w-full text-left p-4 bg-white font-bold text-lg text-[#5D4037] flex justify-between items-center hover:bg-gray-50 transition-colors">
                        <span>원인 2: 생명과 인간 존엄성에 대한 경시</span>
                         <span class="transform transition-transform duration-300">▼</span>
                    </button>
                    <div class="accordion-content bg-gray-50">
                        <div class="p-4 text-gray-700">
                           <p>레위인이 위협 앞에서 자신의 첩을 희생양으로 내어준 행동, 그리고 불량배들이 한 인간을 하룻밤의 유희거리로 취급하며 폭력을 행사한 것은 당시 사회에 만연했던 생명 경시 풍조와 인간 존엄성의 상실을 극명하게 보여줍니다. 특히 여성의 인권이 철저히 무시당했던 시대의 어두운 단면을 드러냅니다. 이 비극은 한 개인의 문제가 아닌, 사회 전체의 병든 가치관이 빚어낸 참사였습니다.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </main>
    
    <!-- Modals -->
    <div id="modal-rejection" class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 hidden modal z-50">
        <div class="bg-white rounded-lg p-8 max-w-md w-full relative">
            <h3 class="text-2xl font-bold mb-4 text-[#5D4037]">차가운 외면</h3>
            <p class="text-gray-600">레위인 일행은 기브아 성읍에 도착했지만, 아무도 그들을 영접하지 않았습니다. 해는 저물고 어둠이 깔렸지만, 동족의 땅에서 그들은 철저히 이방인이었습니다.</p>
            <button class="absolute top-2 right-2 text-2xl text-gray-500 hover:text-gray-800">&times;</button>
        </div>
    </div>
    <div id="modal-hospitality" class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 hidden modal z-50">
        <div class="bg-white rounded-lg p-8 max-w-md w-full relative">
            <h3 class="text-2xl font-bold mb-4 text-[#5D4037]">노인의 호의</h3>
            <p class="text-gray-600">그때, 마침 밭에서 돌아오던 한 노인이 그들을 발견하고 자신의 집으로 맞아들입니다. 노인은 그들의 발을 씻기고 음식을 대접하며 나그네를 환대하는 도리를 다합니다.</p>
            <button class="absolute top-2 right-2 text-2xl text-gray-500 hover:text-gray-800">&times;</button>
        </div>
    </div>
    <div id="modal-attack" class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 hidden modal z-50">
        <div class="bg-white rounded-lg p-8 max-w-md w-full relative">
            <h3 class="text-2xl font-bold mb-4 text-[#5D4037]">불량배들의 습격</h3>
            <p class="text-gray-600">밤이 깊어지자, 성읍의 불량배들이 노인의 집을 에워싸고 레위 사람을 내놓으라고 소리칩니다. 그들은 동성 성폭행을 목적으로 그를 위협합니다.</p>
            <button class="absolute top-2 right-2 text-2xl text-gray-500 hover:text-gray-800">&times;</button>
        </div>
    </div>
     <div id="modal-tragedy" class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 hidden modal z-50">
        <div class="bg-white rounded-lg p-8 max-w-md w-full relative">
            <h3 class="text-2xl font-bold mb-4 text-red-800">비극적 결말</h3>
            <p class="text-gray-600">위협에 못 이긴 레위인은 결국 자신의 첩을 문밖으로 내어줍니다. 불량배들은 밤새도록 그녀를 능욕하고 학대했고, 다음 날 아침 그녀는 집 문 앞에서 싸늘한 주검으로 발견됩니다.</p>
            <button class="absolute top-2 right-2 text-2xl text-gray-500 hover:text-gray-800">&times;</button>
        </div>
    </div>


    <script>
        document.addEventListener('DOMContentLoaded', () => {
            // Sound effects setup
            // To enable sound effects, replace the src values with actual paths to your sound files.
            // Example: const clickSound = new Audio('path/to/your/click.mp3');
            const clickSound = new Audio(); // For general clicks
            // clickSound.src = 'sounds/click.mp3'; // User to provide sound file path
            clickSound.volume = 0.5;

            const correctSound = new Audio(); // For correct actions
            // correctSound.src = 'sounds/correct.mp3'; // User to provide sound file path
            correctSound.volume = 0.5;

            const incorrectSound = new Audio(); // For incorrect actions
            // incorrectSound.src = 'sounds/incorrect.mp3'; // User to provide sound file path
            incorrectSound.volume = 0.5;

            const modalOpenSound = new Audio(); // For opening modals
            // modalOpenSound.src = 'sounds/modal_open.mp3'; // User to provide sound file path
            modalOpenSound.volume = 0.5;

            const modalCloseSound = new Audio(); // For closing modals
            // modalCloseSound.src = 'sounds/modal_close.mp3'; // User to provide sound file path
            modalCloseSound.volume = 0.5;


            const playSound = (audio) => {
                // Ensure audio is loaded and can be played
                if (audio && audio.readyState >= 2) {
                    audio.currentTime = 0; // Rewind to start
                    audio.play().catch(e => console.log("Audio play failed:", e)); // Catch potential play errors
                }
            };


            const startBtn = document.getElementById('start-btn');
            const sections = document.querySelectorAll('#main-content > section');

            startBtn.addEventListener('click', () => {
                playSound(clickSound);
                window.scrollTo({
                    top: document.getElementById('section-journey').offsetTop - 20,
                    behavior: 'smooth'
                });
            });

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.remove('opacity-0', 'translate-y-10');
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1 });

            sections.forEach(section => {
                observer.observe(section);
            });

            // Interactive cards
            const cards = document.querySelectorAll('.interactive-card');
            cards.forEach(card => {
                card.addEventListener('click', () => {
                    playSound(clickSound);
                    const content = card.querySelector('.card-content');
                    content.classList.toggle('hidden');
                });
            });

            // Modals
            const modalBtns = document.querySelectorAll('.modal-btn');
            const modals = document.querySelectorAll('.modal');

            modalBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    playSound(modalOpenSound);
                    const modalId = btn.getAttribute('data-modal');
                    document.getElementById(modalId).classList.remove('hidden');
                });
            });

            modals.forEach(modal => {
                const closeBtn = modal.querySelector('button');
                closeBtn.addEventListener('click', () => {
                    playSound(modalCloseSound);
                    modal.classList.add('hidden');
                });
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        playSound(modalCloseSound);
                        modal.classList.add('hidden');
                    }
                });
            });

            // Timeline Puzzle
            const timelinePuzzleContainer = document.getElementById('timeline-puzzle');
            const timelineFeedback = document.getElementById('timeline-feedback');
            const timelineResetBtn = document.getElementById('timeline-reset');
            const analysisSection = document.getElementById('section-analysis');

            const timelineEvents = [
                { id: 1, text: '지연된 출발' },
                { id: 2, text: '기브아 도착' },
                { id: 3, text: '차가운 외면' },
                { id: 4, text: '노인의 호의' },
                { id: 5, text: '불량배들의 습격' },
                { id: 6, text: '첩의 죽음' }
            ];
            
            const correctOrder = [1, 2, 3, 4, 5, 6];
            let userSelection = [];

            function shuffle(array) {
                let currentIndex = array.length, randomIndex;
                while (currentIndex != 0) {
                    randomIndex = Math.floor(Math.random() * currentIndex);
                    currentIndex--;
                    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
                }
                return array;
            }

            function setupTimeline() {
                userSelection = [];
                timelinePuzzleContainer.innerHTML = '';
                timelineFeedback.textContent = '';
                timelineFeedback.className = 'text-center mt-4 h-6 font-bold';
                analysisSection.classList.add('hidden', 'opacity-0');

                const shuffledEvents = shuffle([...timelineEvents]);
                shuffledEvents.forEach(event => {
                    const item = document.createElement('div');
                    item.className = 'timeline-item border-2 border-gray-300 p-4 rounded-lg text-center bg-white shadow-sm';
                    item.textContent = event.text;
                    item.dataset.id = event.id;
                    item.addEventListener('click', handleTimelineClick);
                    timelinePuzzleContainer.appendChild(item);
                });
            }

            function handleTimelineClick(e) {
                playSound(clickSound); // Play click sound for timeline item selection
                const clickedItem = e.target;
                const id = parseInt(clickedItem.dataset.id);

                if (userSelection.includes(id)) return; // Prevent re-selecting

                userSelection.push(id);
                clickedItem.classList.add('selected', 'bg-[#EAE3D3]'); // Highlight selected item

                if (userSelection.length === correctOrder.length) {
                    checkTimeline();
                }
            }

            function checkTimeline() {
                let isCorrect = true;
                for (let i = 0; i < correctOrder.length; i++) {
                    if (userSelection[i] !== correctOrder[i]) {
                        isCorrect = false;
                        break;
                    }
                }

                if (isCorrect) {
                    playSound(correctSound);
                    timelineFeedback.textContent = '정답입니다! 사건의 전말이 밝혀졌습니다.';
                    timelineFeedback.classList.add('text-green-600');
                    document.querySelectorAll('.timeline-item').forEach(item => {
                        item.classList.add('correct');
                        item.classList.remove('selected');
                    });
                    analysisSection.classList.remove('hidden');
                    setTimeout(() => {
                        analysisSection.classList.remove('opacity-0', 'translate-y-10');
                         window.scrollTo({
                            top: analysisSection.offsetTop - 60,
                            behavior: 'smooth'
                        });
                    }, 100);

                } else {
                    playSound(incorrectSound);
                    timelineFeedback.textContent = '순서가 틀렸습니다. 다시 시도해보세요.';
                    timelineFeedback.classList.add('text-red-600');
                    document.querySelectorAll('.timeline-item').forEach(item => {
                        item.classList.add('incorrect');
                    });
                    setTimeout(() => {
                        document.querySelectorAll('.timeline-item').forEach(item => {
                            item.classList.remove('selected', 'incorrect', 'bg-[#EAE3D3]');
                        });
                        userSelection = []; // Reset selection for new attempt
                        timelineFeedback.textContent = ''; // Clear feedback
                    }, 2000); // Give user time to see error before reset
                }
            }
            
            timelineResetBtn.addEventListener('click', () => {
                playSound(clickSound);
                setupTimeline();
            });

            setupTimeline(); // Initial setup

            // Accordion
            const accordionHeaders = document.querySelectorAll('.accordion-header');
            accordionHeaders.forEach(header => {
                header.addEventListener('click', () => {
                    playSound(clickSound);
                    const content = header.nextElementSibling;
                    const icon = header.querySelector('span:last-child');
                    
                    if (content.style.maxHeight) {
                        content.style.maxHeight = null;
                        icon.style.transform = 'rotate(0deg)';
                    } else {
                        // Close all other open accordions
                        document.querySelectorAll('.accordion-content').forEach(c => c.style.maxHeight = null);
                        document.querySelectorAll('.accordion-header span:last-child').forEach(i => i.style.transform = 'rotate(0deg)');
                        
                        // Open clicked accordion
                        content.style.maxHeight = content.scrollHeight + "px";
                        icon.style.transform = 'rotate(180deg)';
                    }
                });
            });
        });
    </script>
</body>
</html>
    `;
}
