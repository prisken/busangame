export interface Task {
  id: string;
  category: string;
  title: string;
  description?: string; // For the "i" icon popup
  completed: boolean;
  image?: string | null; // Base64 or URL
}

export interface Team {
  id: string;
  name: string;
  password: string; // Simple password
  tasks: Task[];
  completedAt?: string | null; // ISO timestamp when all tasks were completed
}

export const INITIAL_TASKS: Task[] = [
  {
    id: 'm1',
    category: '🛒 市場美食任務',
    title: '買到堅果糖餅並拍下流心照',
    description: '前往BIFF廣場或傳統市場，購買著名的堅果糖餅(Ssiat Hotteok)。咬開或切開後，拍下裡面流出的黑糖堅果內餡。',
    completed: false,
  },
  {
    id: 'm2',
    category: '🛒 市場美食任務',
    title: '找到長條形及片狀魚糕',
    description: '在魚糕店尋找兩種不同形狀的魚糕：長條形(Bar type)和片狀(Sheet type)。將它們放在一起合照。',
    completed: false,
  },
  {
    id: 'm3',
    category: '🛒 市場美食任務',
    title: '錄製全組說「Mashisoyo」影片',
    description: '全員入鏡，對著鏡頭大聲說出「Mashisoyo」(好吃)。影片需清晰收錄聲音。',
    completed: false,
  },
  {
    id: 'c1',
    category: '🔍 文化搜尋任務',
    title: '與 1 米長的乾海帶合照',
    description: '在乾貨店尋找超長的乾海帶(通常有包裝)。找一位隊員當比例尺，證明海帶長度接近或超過1米。',
    completed: false,
  },
  {
    id: 'c2',
    category: '🔍 文化搜尋任務',
    title: '辨認三種尺寸的鯷魚',
    description: '找到販賣鯷魚的攤位，拍下大、中、小三種不同尺寸的乾鯷魚對比照。',
    completed: false,
  },
  {
    id: 'c3',
    category: '🔍 文化搜尋任務',
    title: '找到印有「福」字的韓式筷子',
    description: '在餐具店或餐廳尋找金屬扁筷，上面需刻有漢字「福」。',
    completed: false,
  },
  {
    id: 'p1',
    category: '📸 創意拍照任務',
    title: '青沙浦紅白燈塔對峙照',
    description: '利用錯位或構圖，拍攝一張看起來像是在紅白雙燈塔之間進行對峙或互動的照片。',
    completed: false,
  },
  {
    id: 'p2',
    category: '📸 創意拍照任務',
    title: '灌籃高手平交道火車合照',
    description: '前往海雲台藍線公園的平交道（類似灌籃高手場景），在火車（膠囊列車或海岸列車）經過時合照。注意安全！',
    completed: false,
  },
  {
    id: 'g1',
    category: '🎮 傳統遊戲挑戰',
    title: '完成「打畫片」挑戰',
    description: '成功將地上的畫片打翻過來。拍下成功的瞬間或與戰利品合照。',
    completed: false,
  },
  {
    id: 'g2',
    category: '🎮 傳統遊戲挑戰',
    title: '完成「投壺」挑戰',
    description: '每人投擲一次，全隊累計投進至少3支箭。拍下投進的箭與壺的合照。',
    completed: false,
  },
];
