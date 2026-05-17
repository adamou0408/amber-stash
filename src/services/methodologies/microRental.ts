import type { Methodology } from '@/types/methodology';

/**
 * 小坪數 / 租屋（為台灣都會 25 坪以下、租屋族設計）
 * 內建示範方法論。
 *
 * 生命週期定位：maintenance — 與 default / 廖心筠並列，給特定居住條件用。
 *
 * 核心：
 * - 不能釘牆 → 3M 無痕、吸盤、伸縮桿、磁吸條
 * - 垂直空間最大化 → 頂天立地櫃、洞洞板、軌道系統
 * - 多功能家具 → 掀床 / 沙發床 / 升降桌 / 和室地台
 * - 搬家友善 → 可拆解 / 可重組
 */
export const MICRO_RENTAL_METHODOLOGY: Methodology = {
  id: 'micro-rental-zh',
  authorId: 'placeholder-micro-rental',
  name: '小坪數 / 租屋收納',
  description:
    '台灣都會小宅 + 租屋族專用。不能釘牆、要垂直擴張、要可搬走的收納。比起一般建議更務實 — 「我能不能下次搬家直接帶走」是核心問題。',
  language: 'zh-TW',
  systemPrompt:
    '你是專門服務租屋族與小坪數的整理顧問。每條建議都考量兩件事：① 不能改裝牆面（房東不准 / 押金扣不起）、② 搬家時能不能拆下帶走。推薦的工具永遠以 3M 無痕系列、伸縮桿、可拆組家具為主。',
  lifecyclePhase: 'maintenance',
  rules: [
    {
      id: 'vertical-first',
      appliesWhen: { type: 'overcapacity', ratio: 0.7 },
      priority: 100,
      suggestion: {
        titleTemplate: '⬆️ 垂直空間是你的金礦 · {crowdedSpace} 已 {crowdedRatio}',
        bodyTemplate:
          '小坪數的真實坪數 = 地板面積 × 牆面高度。{crowdedSpace} 已超過 70% 滿但其實天花板還空 80%。建議：① 頂天立地櫃（IKEA BILLY 加頂部延伸）、② 洞洞板（1㎡ 可掛 50+ 件）、③ 牆面磁吸條（廚房刀架 / 化妝品）。先擴向上，再說減量。',
        tags: ['micro-rental', 'vertical'],
      },
    },
    {
      id: 'no-drilling-3m',
      appliesWhen: { type: 'hasSpaceKind', kind: 'other' },
      priority: 90,
      suggestion: {
        titleTemplate: '🔧 租屋不能釘牆？三件法寶',
        bodyTemplate:
          '① **3M Command 無痕系列** — 重複黏貼、撕下不留痕（押金安全）。② **伸縮桿** — 牆與牆之間撐起，掛衣物 / 浴室層架都可。③ **吸盤式** — 浴室 / 廚房磁磚適用。這三類能解決 90% 的租屋收納需求，不需要任何工具。',
        tags: ['micro-rental', '3m'],
      },
    },
    {
      id: 'pegboard-power',
      appliesWhen: { type: 'categoryCount', category: 'tools', op: '>=', value: 5 },
      priority: 75,
      suggestion: {
        titleTemplate: '🪵 洞洞板 · {tools} 件工具上牆',
        bodyTemplate:
          '工具放地上 / 抽屜 = 永遠找不到 + 永遠多買。洞洞板 60×60cm 一塊可掛 50 件以上。3M 無痕貼或免釘 L 架固定。看得見 = 用得到 = 不重複買。IKEA SKÅDIS 系列最齊全，配件多。',
        tags: ['micro-rental', 'pegboard'],
      },
    },
    {
      id: 'multi-functional-furniture',
      appliesWhen: { type: 'overcapacity', ratio: 0.85 },
      priority: 80,
      suggestion: {
        titleTemplate: '🛋️ 多功能家具 · 一物多用',
        bodyTemplate:
          '{crowdedSpace} 已超過 85% 滿但你不能加櫃子（小坪數 / 動線會死）。換思路 — 把家具變收納：① 掀床（床底 60cm 高，超大）、② 沙發床（客廳變客房）、③ 升降桌（不工作時可變低茶几）、④ 和室地台（榻榻米下整層收納）。',
        tags: ['micro-rental', 'multi-function'],
      },
    },
    {
      id: 'rolling-cart',
      appliesWhen: { type: 'categoryCount', category: '*', op: '>=', value: 10 },
      priority: 60,
      suggestion: {
        titleTemplate: '🛒 移動式收納推車 · 一物多區',
        bodyTemplate:
          '小坪數常常「同一物品多區域用」— 例如保養品早上在浴室、晚上在臥房。IKEA RÅSKOG 推車 NT$ 899 可推來推去，等於「家具會跟著你動」。也適合常搬家 — 整台直接搬上小貨車。',
        tags: ['micro-rental', 'mobility'],
      },
    },
    {
      id: 'fold-flat-furniture',
      appliesWhen: { type: 'categoryCount', category: '*', op: '>=', value: 30 },
      priority: 50,
      suggestion: {
        titleTemplate: '📦 搬家友善 · 選可拆組的家具',
        bodyTemplate:
          '租屋族下次搬家是 6-24 個月內的事。買家具時優先選：① IKEA / NITORI 平整包裝（可拆裝回原狀）、② 系統化模組（KALLAX 4 格、SKUBB 收納盒）— 搬家時拆解、新家重組。**避開**：實木重家具、訂製品、靠死膠合的便宜家具（拆一次就壞）。',
        tags: ['micro-rental', 'mobile-friendly'],
      },
    },
    {
      id: 'shoebox-15-pairs',
      appliesWhen: {
        type: 'and',
        conditions: [
          { type: 'hasSpaceKind', kind: 'drawer' },
          { type: 'categoryCount', category: 'tools', op: '>', value: 0 },
        ],
      },
      priority: 40,
      suggestion: {
        titleTemplate: '👟 鞋櫃 8-15 雙夠用',
        bodyTemplate:
          '台灣租屋玄關通常 ≤ 1 米寬。成人鞋櫃 8-15 雙就夠日常輪替。底層留 15cm 高給「今日穿過的鞋」（不要馬上收進去 — 散濕氣）。雨多請設長傘桶式架。',
        tags: ['micro-rental', 'shoe-rack'],
      },
    },
    {
      id: 'no-bulk-buy',
      appliesWhen: { type: 'overcapacity', ratio: 0.9 },
      priority: 70,
      suggestion: {
        titleTemplate: '🛍️ 別在 Costco 囤貨',
        bodyTemplate:
          '小坪數 + Costco 大包裝 = 災難。{crowdedSpace} 已 {crowdedRatio} 滿，囤一年份衛生紙會把客廳變倉庫。算「單位坪數 vs 折扣」— 你省下的 NT$ 200 折扣，相當於用月租 NT$ 800 / 坪的空間存放半年。**不划算**。',
        tags: ['micro-rental', 'consumption'],
      },
    },
    {
      id: 'empty',
      appliesWhen: { type: 'noItems' },
      priority: 100,
      suggestion: {
        titleTemplate: '從垂直空間想像力開始',
        bodyTemplate:
          '租屋小坪數的第一步不是「整理」，是「重新看你的空間」。下次回家站在門口，抬頭看天花板 — 你浪費了多少垂直空間？拍張照建一個叫「待擴張」的空間，把這個觀察存進來。下次決定買什麼收納品就有依據。',
      },
    },
  ],
  shoppingRules: [
    {
      id: '3m-command-set',
      appliesWhen: { type: 'categoryCount', category: '*', op: '>', value: 0 },
      pick: {
        nameTemplate: '3M Command 無痕掛勾 / 掛架組合包',
        reasonTemplate: '租屋族第一筆投資。撕下不留痕 = 押金安全。建議買「綜合包」一次到位。',
        brand: '3M',
        sku: 'Command',
        priceTwdMin: 200,
        priceTwdMax: 1500,
      },
    },
    {
      id: 'tension-rod',
      appliesWhen: { type: 'hasSpaceKind', kind: 'other' },
      pick: {
        nameTemplate: '伸縮桿（強力型）×3',
        reasonTemplate: '浴室掛毛巾 / 衣櫃多掛一層 / 廚房水槽下分層 — 三支不同尺寸是標配。',
        priceTwdMin: 100,
        priceTwdMax: 500,
      },
    },
    {
      id: 'raskog-cart',
      appliesWhen: { type: 'categoryCount', category: '*', op: '>=', value: 10 },
      pick: {
        nameTemplate: 'IKEA RÅSKOG 移動推車',
        reasonTemplate: '小坪數的萬用收納 — 浴室、書桌、廚房都能用。搬家直接推上車。',
        brand: 'IKEA',
        sku: 'RÅSKOG',
        priceTwdMin: 899,
        priceTwdMax: 899,
      },
    },
    {
      id: 'skadis-pegboard',
      appliesWhen: { type: 'categoryCount', category: 'tools', op: '>=', value: 5 },
      pick: {
        nameTemplate: 'IKEA SKÅDIS 洞洞板套組',
        reasonTemplate: '配件最齊全。56×56cm 洞洞板 + 掛勾 / 籃子 / 容器配件約 NT$ 1500 可搞定。',
        brand: 'IKEA',
        sku: 'SKÅDIS',
        priceTwdMin: 599,
        priceTwdMax: 2000,
      },
    },
  ],
  appliesTo: [
    'clothing',
    'kitchen',
    'books',
    'electronics',
    'cosmetics',
    'tools',
    'other',
  ],
  pricing: { kind: 'free' },
  version: 1,
};
