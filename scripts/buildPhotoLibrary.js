/**
 * Build photoLibrary into detectionFixtures.json.
 *
 * - 每個 scenario 的 raw Unsplash base URL list 從 Unsplash search page 抓出來
 * - 在每個 scenario 內 dedup
 * - 不加 query string（client 端在 buildPhotoUrl() 動態加,可控制尺寸/品質）
 * - 寫回 src/services/fixtures/detectionFixtures.json
 *
 * 想擴充更多照片:加 keyword 抓更多 URL,塞進對應 scenario 的 array,重跑這個 script。
 *
 * 使用:`node scripts/buildPhotoLibrary.js`
 */
const fs = require('node:fs');
const path = require('node:path');

const SCENARIOS_META = [
  {
    id: 'wardrobe-clothing',
    label: '衣櫃 — 日常衣物',
    description: '長袖、毛衣、牛仔褲',
    spaceKind: 'wardrobe',
    detections: [
      { name: '長袖襯衫', category: 'clothing', quantity: 5, confidence: 0.88, bbox: { x: 0.05, y: 0.1, w: 0.25, h: 0.3 } },
      { name: '針織毛衣', category: 'clothing', quantity: 3, confidence: 0.78, bbox: { x: 0.35, y: 0.1, w: 0.25, h: 0.3 } },
      { name: '牛仔褲', category: 'clothing', quantity: 2, confidence: 0.7, bbox: { x: 0.65, y: 0.1, w: 0.25, h: 0.3 } },
    ],
  },
  {
    id: 'desk-stationery',
    label: '書桌 — 文具',
    description: '筆記本與筆',
    spaceKind: 'desk',
    detections: [
      { name: '筆記本', category: 'books', quantity: 1, confidence: 0.9, bbox: { x: 0.1, y: 0.2, w: 0.45, h: 0.55 } },
      { name: '原子筆', category: 'books', quantity: 3, confidence: 0.82, bbox: { x: 0.6, y: 0.25, w: 0.25, h: 0.2 } },
      { name: '鉛筆', category: 'books', quantity: 2, confidence: 0.75, bbox: { x: 0.6, y: 0.5, w: 0.25, h: 0.2 } },
    ],
  },
  {
    id: 'drawer-electronics',
    label: '抽屜 — 電子配件',
    description: '充電線、充電頭、配件',
    spaceKind: 'drawer',
    detections: [
      { name: '充電線', category: 'electronics', quantity: 1, confidence: 0.88, bbox: { x: 0.1, y: 0.4, w: 0.5, h: 0.4 } },
      { name: '充電頭', category: 'electronics', quantity: 1, confidence: 0.86, bbox: { x: 0.55, y: 0.2, w: 0.3, h: 0.4 } },
    ],
  },
  {
    id: 'kitchen-storage',
    label: '廚房 — 抽屜餐具',
    description: '馬克杯、餐盤、餐具組',
    spaceKind: 'other',
    detections: [
      { name: '馬克杯', category: 'kitchen', quantity: 4, confidence: 0.85, bbox: { x: 0.05, y: 0.1, w: 0.3, h: 0.4 } },
      { name: '餐盤', category: 'kitchen', quantity: 3, confidence: 0.82, bbox: { x: 0.4, y: 0.1, w: 0.3, h: 0.4 } },
      { name: '餐具組', category: 'kitchen', quantity: 1, confidence: 0.78, bbox: { x: 0.05, y: 0.55, w: 0.6, h: 0.35 } },
    ],
  },
  {
    id: 'low-confidence-mix',
    label: '（測試）低信心混合',
    description: '雜亂雜物 — 用來測試低信心警示 UI',
    spaceKind: 'other',
    detections: [
      { name: '不明小物 A', category: 'other', quantity: 1, confidence: 0.45 },
      { name: '不明小物 B', category: 'other', quantity: 2, confidence: 0.38 },
      { name: '雜物盒', category: 'tools', quantity: 1, confidence: 0.55 },
    ],
  },
];

// ---------------- raw URL pools (Unsplash CDN base URLs，無 query string) ----------------

const RAW_PHOTOS = {
  'wardrobe-clothing': `
https://images.unsplash.com/photo-1672137233327-37b0c1049e77
https://images.unsplash.com/photo-1614631446501-abcf76949eca
https://images.unsplash.com/photo-1649361811423-a55616f7ab11
https://images.unsplash.com/photo-1604882767135-b41fac508fff
https://images.unsplash.com/photo-1618236444721-4a8dba415c15
https://images.unsplash.com/photo-1567113463300-102a7eb3cb26
https://images.unsplash.com/photo-1708397016786-8916880649b8
https://images.unsplash.com/photo-1584467331215-a960b66c222b
https://images.unsplash.com/photo-1611048268330-53de574cae3b
https://images.unsplash.com/photo-1517502166878-35c93a0072f0
https://images.unsplash.com/photo-1558769132-cb1aea458c5e
https://images.unsplash.com/photo-1631048499455-4f9e26f23b9f
https://images.unsplash.com/photo-1472666260353-23210544cdf1
https://images.unsplash.com/photo-1640357154220-9775b0f31dec
https://images.unsplash.com/photo-1532646195885-5c09e5c45934
https://images.unsplash.com/photo-1687953413905-731f620177ae
https://images.unsplash.com/photo-1577020914435-7ae6b1091ebd
https://images.unsplash.com/photo-1594883422096-c7f0b81e0133
https://images.unsplash.com/photo-1655252205431-5d0ef316837b
https://images.unsplash.com/photo-1530411554903-7e745b9f1f6d
https://images.unsplash.com/photo-1662986788594-01dcf0af44bd
https://images.unsplash.com/photo-1742453161018-73e39a241541
https://images.unsplash.com/photo-1646592491352-b1c02c48e72a
https://images.unsplash.com/photo-1629078691371-2c83d139c986
https://images.unsplash.com/photo-1630699144552-b2b60b277b75
https://images.unsplash.com/photo-1520204871215-20ab878aa1a9
https://images.unsplash.com/photo-1562157873-818bc0726f68
https://images.unsplash.com/photo-1540221652346-e5dd6b50f3e7
https://images.unsplash.com/photo-1604176354204-9268737828e4
https://images.unsplash.com/photo-1504198458649-3128b932f49e
https://images.unsplash.com/photo-1517677208171-0bc6725a3e60
https://images.unsplash.com/photo-1630329273801-8f629dba0a72
https://images.unsplash.com/photo-1641642231157-0849081598a2
https://images.unsplash.com/photo-1560060141-7b9018741ced
https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99
https://images.unsplash.com/photo-1699797467199-6bdf301649e8
https://images.unsplash.com/photo-1664095885731-c492bd6eeb7b
https://images.unsplash.com/photo-1548768041-2fceab4c0b85
https://images.unsplash.com/photo-1619032468883-89a84f565cba
https://images.unsplash.com/photo-1571139627661-cf707929f465
https://images.unsplash.com/photo-1489987707025-afc232f7ea0f
https://images.unsplash.com/photo-1603400521630-9f2de124b33b
https://images.unsplash.com/photo-1490481651871-ab68de25d43d
https://images.unsplash.com/photo-1551232864-3f0890e580d9
https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3
https://images.unsplash.com/photo-1520006403909-838d6b92c22e
https://images.unsplash.com/photo-1501127122-f385ca6ddd9d
https://images.unsplash.com/photo-1637228393246-c38a4b3d2011
https://images.unsplash.com/photo-1580682312385-e94d8de1cf3c
https://images.unsplash.com/photo-1573677275957-d6dbf54c0a4e
https://images.unsplash.com/photo-1555529733-ba28d9c4587c
https://images.unsplash.com/photo-1519220279207-fddf068f2141
https://images.unsplash.com/photo-1571273134620-1ef375de9b84
https://images.unsplash.com/photo-1527519124254-9dafd8b3533b
https://images.unsplash.com/photo-1558361716-f8144bad90f3
https://images.unsplash.com/photo-1689887883155-ea1e241b34d7
https://images.unsplash.com/photo-1624306070850-587eb714e25b
https://images.unsplash.com/photo-1572355984117-26906d54df51
https://images.unsplash.com/photo-1584467331486-29e6c30262c3
https://images.unsplash.com/photo-1633698479189-4a5ece854ffa
https://images.unsplash.com/photo-1665411887939-a4ee3487c680
https://images.unsplash.com/photo-1647158323261-545ac0ff5c6c
https://images.unsplash.com/photo-1716719129415-43ab62750a79
https://images.unsplash.com/photo-1581154262244-30d0b30ce86e
https://images.unsplash.com/photo-1642677581065-c69c6ef4088c
https://images.unsplash.com/photo-1604072374690-0e7d7bddd54e
https://images.unsplash.com/photo-1542060748-10c28b62716f
https://images.unsplash.com/photo-1664095885197-fdff6611560c
https://images.unsplash.com/photo-1606053929013-311c13f97b5f
https://images.unsplash.com/photo-1586547017149-84a20c164607
https://images.unsplash.com/photo-1596433904500-97b901c5d274
https://images.unsplash.com/photo-1517137619222-3d3b1948e27d
https://images.unsplash.com/photo-1698586252650-f0d15ff0c8da
https://images.unsplash.com/photo-1631067128698-2f4f8ce87e28
https://images.unsplash.com/photo-1721044168675-b577e899413d
https://images.unsplash.com/photo-1602810316693-3667c854239a
https://images.unsplash.com/photo-1602810316498-ab67cf68c8e1
https://images.unsplash.com/photo-1588795904317-2f4ab1a0a852
https://images.unsplash.com/photo-1635091984256-dc15291bb483
https://images.unsplash.com/photo-1768734831178-4898bca7225c
https://images.unsplash.com/photo-1775327658309-bf527b45b255
https://images.unsplash.com/photo-1768228542712-0d68063ec9a9
https://images.unsplash.com/photo-1773240307047-8412fcf1d866
https://images.unsplash.com/photo-1773998577838-c58ae0c0e9bb
https://images.unsplash.com/photo-1759503217773-ad0d0ab4e025
https://images.unsplash.com/photo-1763804021505-0d1372efa914
https://images.unsplash.com/photo-1768264312544-626125cad303
https://images.unsplash.com/photo-1613591674239-216f556d9ba9
https://images.unsplash.com/photo-1772985451229-4e01ce31f8fc
`,
  'desk-stationery': `
https://images.unsplash.com/photo-1566699270403-3f7e3f340664
https://images.unsplash.com/photo-1535957998253-26ae1ef29506
https://images.unsplash.com/photo-1500067803284-4304564c8655
https://images.unsplash.com/photo-1512805668868-1608a189cc2b
https://images.unsplash.com/photo-1485965373059-f07657e9f841
https://images.unsplash.com/photo-1611269154421-4e27233ac5c7
https://images.unsplash.com/photo-1499750310107-5fef28a66643
https://images.unsplash.com/photo-1562240020-ce31ccb0fa7d
https://images.unsplash.com/photo-1513530534585-c7b1394c6d51
https://images.unsplash.com/photo-1487017159836-4e23ece2e4cf
https://images.unsplash.com/photo-1505330622279-bf7d7fc918f4
https://images.unsplash.com/photo-1589362281138-e3f7ebe47f1a
https://images.unsplash.com/photo-1476365518243-f738bf58443d
https://images.unsplash.com/photo-1611324062122-076b1076c6cc
https://images.unsplash.com/photo-1567987768246-df799f9c8afb
https://images.unsplash.com/photo-1518655048521-f130df041f66
https://images.unsplash.com/photo-1500989145603-8e7ef71d639e
https://images.unsplash.com/photo-1437419764061-2473afe69fc2
https://images.unsplash.com/photo-1531346878377-a5be20888e57
https://images.unsplash.com/photo-1511467687858-23d96c32e4ae
https://images.unsplash.com/photo-1629824019366-ffcb6b334634
https://images.unsplash.com/photo-1620275765334-4ed948bb4502
https://images.unsplash.com/photo-1493723843671-1d655e66ac1c
https://images.unsplash.com/photo-1568052557675-0c6095a407ca
https://images.unsplash.com/photo-1491492628162-d88fbe1cdd04
https://images.unsplash.com/photo-1555178364-6c1f870e3349
https://images.unsplash.com/photo-1633304690105-8ccaa01dfa06
https://images.unsplash.com/photo-1541462608143-67571c6738dd
https://images.unsplash.com/photo-1620287920810-3f5b9746380c
https://images.unsplash.com/photo-1452601395039-3184bc03cb09
https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3
https://images.unsplash.com/photo-1501618669935-18b6ecb13d6d
https://images.unsplash.com/photo-1483546416237-76fd26bbcdd1
https://images.unsplash.com/photo-1587135991058-8816b028691f
https://images.unsplash.com/photo-1591195852468-03a01d1375d6
https://images.unsplash.com/photo-1623697899811-f2403f50685e
https://images.unsplash.com/photo-1599008633840-052c7f756385
https://images.unsplash.com/photo-1601321268954-22646044f7d0
https://images.unsplash.com/photo-1647559709298-c0e3dcb47092
https://images.unsplash.com/photo-1611079830811-865ff4428d17
https://images.unsplash.com/photo-1512279093314-5926a353720c
https://images.unsplash.com/photo-1617177435596-1c9e30d6d608
https://images.unsplash.com/photo-1462642109801-4ac2971a3a51
https://images.unsplash.com/photo-1600531597946-f9b1d7b0f486
https://images.unsplash.com/photo-1722927731527-a6cd21b33b27
https://images.unsplash.com/photo-1654931800100-2ecf6eee7c64
https://images.unsplash.com/photo-1470790376778-a9fbc86d70e2
https://images.unsplash.com/photo-1631173716529-fd1696a807b0
https://images.unsplash.com/photo-1456735190827-d1262f71b8a3
https://images.unsplash.com/photo-1513077202514-c511b41bd4c7
https://images.unsplash.com/photo-1601001435957-74f0958a93fb
https://images.unsplash.com/photo-1551925608-12e169132446
https://images.unsplash.com/photo-1612599316791-451087c7fe15
https://images.unsplash.com/photo-1568205612837-017257d2310a
https://images.unsplash.com/photo-1567855354833-ac2c4f967b0c
https://images.unsplash.com/photo-1611758497398-5224931d155a
https://images.unsplash.com/photo-1510070009289-b5bc34383727
https://images.unsplash.com/photo-1616400619175-5beda3a17896
https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e
https://images.unsplash.com/photo-1542435503-956c469947f6
https://images.unsplash.com/photo-1533090161767-e6ffed986c88
https://images.unsplash.com/photo-1650661926447-9efb2610f64c
https://images.unsplash.com/photo-1585832770485-e68a5dbfad52
https://images.unsplash.com/photo-1531668720450-39cf1563fab9
https://images.unsplash.com/photo-1591382696684-38c427c7547a
https://images.unsplash.com/photo-1486946255434-2466348c2166
https://images.unsplash.com/photo-1617239098289-ad0ee436361e
https://images.unsplash.com/photo-1721714933699-1a7650a79754
https://images.unsplash.com/photo-1654356709115-3f68998bead4
https://images.unsplash.com/photo-1542325488573-a28b3cd3c91d
https://images.unsplash.com/photo-1473186505569-9c61870c11f9
https://images.unsplash.com/photo-1559557809-e9b6eabeabfc
https://images.unsplash.com/photo-1679119790850-161688b0417e
https://images.unsplash.com/photo-1566939028087-c4be299e0593
https://images.unsplash.com/photo-1656941599882-808d7b04b86a
https://images.unsplash.com/photo-1501504905252-473c47e087f8
https://images.unsplash.com/photo-1555601568-c9e6f328489b
https://images.unsplash.com/photo-1611677806845-363fccca2c51
https://images.unsplash.com/photo-1575318634028-6a0cfcb60c59
https://images.unsplash.com/photo-1571624436279-b272aff752b5
https://images.unsplash.com/photo-1612367980327-7454a7276aa7
https://images.unsplash.com/photo-1651761409007-0395097c269d
https://images.unsplash.com/photo-1581431886211-6b932f8367f2
https://images.unsplash.com/photo-1554757387-fa0367573d09
https://images.unsplash.com/photo-1598620617137-2ab990aadd37
https://images.unsplash.com/photo-1654542645844-590f5b8c146a
https://images.unsplash.com/photo-1683921045461-b8dc5ad37740
https://images.unsplash.com/photo-1616593772450-6220bc809944
https://images.unsplash.com/photo-1606997875311-857add95bca0
https://images.unsplash.com/photo-1497032628192-86f99bcd76bc
https://images.unsplash.com/photo-1558478551-1a378f63328e
https://images.unsplash.com/photo-1629317422263-9317e911014a
https://images.unsplash.com/photo-1555212697-194d092e3b8f
https://images.unsplash.com/photo-1648994517761-a35b826d5456
https://images.unsplash.com/photo-1531347334762-59780ece5c76
https://images.unsplash.com/photo-1518665750801-883c188a660d
https://images.unsplash.com/photo-1521649415036-659258dc424f
https://images.unsplash.com/photo-1629317337307-e37f95ebc372
https://images.unsplash.com/photo-1504198070170-4ca53bb1c1fa
https://images.unsplash.com/photo-1700451761309-656bd9439443
`,
  'drawer-electronics': `
https://images.unsplash.com/photo-1557767382-97b28f5488e7
https://images.unsplash.com/photo-1671785120538-c24cbe823ccc
https://images.unsplash.com/photo-1583863788434-e58a36330cf0
https://images.unsplash.com/photo-1572721546624-05bf65ad7679
https://images.unsplash.com/photo-1671785253964-bdb43087ed99
https://images.unsplash.com/photo-1671782762232-217c587d7f1f
https://images.unsplash.com/photo-1671782584185-1300064c5289
https://images.unsplash.com/photo-1603539444875-76e7684265f6
https://images.unsplash.com/photo-1704474618942-ae933a8edd86
https://images.unsplash.com/photo-1671782298320-5f4fe4ded064
https://images.unsplash.com/photo-1671785291804-5e1286d29049
https://images.unsplash.com/photo-1725304382197-663ae3864750
https://images.unsplash.com/photo-1587037542794-6ca5f4772330
https://images.unsplash.com/photo-1671785196242-ba6b37b10ce5
https://images.unsplash.com/photo-1499033300314-43c811cff6d5
https://images.unsplash.com/photo-1518181835702-6eef8b4b2113
https://images.unsplash.com/photo-1625276254563-f0fbbf66a5e7
https://images.unsplash.com/photo-1717667745852-a5bd6876c1de
https://images.unsplash.com/photo-1601462904263-f2fa0c851cb9
https://images.unsplash.com/photo-1517373116369-9bdb8cdc9f62
https://images.unsplash.com/photo-1473831818960-c89731aabc3e
https://images.unsplash.com/photo-1687038520563-2310e8b06ed2
https://images.unsplash.com/photo-1621294465978-6b4198a5f2f7
https://images.unsplash.com/photo-1599256871679-6a154745680b
https://images.unsplash.com/photo-1636116524330-e1b72e090f48
https://images.unsplash.com/photo-1607631755187-298a3f9a640a
https://images.unsplash.com/photo-1557516300-46e218a6961f
https://images.unsplash.com/photo-1663681837878-55c67d6a2692
https://images.unsplash.com/photo-1584809923235-fabdba83d1df
https://images.unsplash.com/photo-1532788411214-25d48ce9275a
https://images.unsplash.com/photo-1731616103600-3fe7ccdc5a59
https://images.unsplash.com/photo-1583142485083-291557266e6a
https://images.unsplash.com/photo-1524226108234-3cccbbbfa86d
https://images.unsplash.com/photo-1562232723-6949c130734d
https://images.unsplash.com/photo-1600577231598-31ea4cb50da3
https://images.unsplash.com/photo-1550004254-fea373b47897
https://images.unsplash.com/photo-1585995603413-eb35b5f4a50b
https://images.unsplash.com/photo-1517320069935-381614f8c1e5
https://images.unsplash.com/photo-1596207891316-23851be3cc20
https://images.unsplash.com/photo-1558492426-df14e290aefa
https://images.unsplash.com/photo-1642983896722-aab474f98129
https://images.unsplash.com/photo-1642983912974-05a554495d88
https://images.unsplash.com/photo-1492107376256-4026437926cd
https://images.unsplash.com/photo-1573868388390-2739872961e6
https://images.unsplash.com/photo-1595756630452-736bc8ef3693
https://images.unsplash.com/photo-1711056823627-64e9089d4a82
https://images.unsplash.com/photo-1639675960002-2f414c58ed79
https://images.unsplash.com/photo-1615086169217-83e1c06c9f4f
https://images.unsplash.com/photo-1619459072761-496c0812331b
https://images.unsplash.com/photo-1649959223405-f927e0fc1e05
https://images.unsplash.com/photo-1603899122911-27c0cb85824a
https://images.unsplash.com/photo-1657181253444-66c4745d5a86
https://images.unsplash.com/photo-1633315921943-c4c12f35db16
https://images.unsplash.com/photo-1607125516845-fa8a14db083a
https://images.unsplash.com/photo-1711056831898-97718f6972d3
https://images.unsplash.com/photo-1566554738544-d962991c3fee
https://images.unsplash.com/photo-1644571669401-9ab344866592
https://images.unsplash.com/photo-1592318348310-f31b61a931c8
https://images.unsplash.com/photo-1614399113305-a127bb2ca893
https://images.unsplash.com/photo-1594843665794-446ce915d840
https://images.unsplash.com/photo-1706275399494-fb26bbc5da63
https://images.unsplash.com/photo-1706275400998-7fc21c8cd8ed
https://images.unsplash.com/photo-1635861321688-b63d28749a82
https://images.unsplash.com/photo-1736516434209-51ece1006788
https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5
https://images.unsplash.com/photo-1632156752398-2b2cb4e6c907
https://images.unsplash.com/photo-1644571669391-c0b48363abed
https://images.unsplash.com/photo-1683322499436-f4383dd59f5a
https://images.unsplash.com/photo-1687038520579-8d8f24721267
https://images.unsplash.com/photo-1695199193329-80b0cc659eb3
https://images.unsplash.com/photo-1608574839637-2f7d0290d01d
https://images.unsplash.com/photo-1531668383211-64743e924c66
https://images.unsplash.com/photo-1555664424-778a1e5e1b48
https://images.unsplash.com/photo-1515940175183-6798529cb860
https://images.unsplash.com/photo-1602526432604-029a709e131c
https://images.unsplash.com/photo-1603732551658-5fabbafa84eb
https://images.unsplash.com/photo-1566793474285-2decf0fc182a
https://images.unsplash.com/photo-1624823183493-ed5832f48f18
https://images.unsplash.com/photo-1636115305669-9096bffe87fd
https://images.unsplash.com/photo-1526406915894-7bcd65f60845
https://images.unsplash.com/photo-1537151377170-9c19a791bbea
https://images.unsplash.com/photo-1577962144759-8dec6b55c952
https://images.unsplash.com/photo-1577976655502-85300c5ca2cb
https://images.unsplash.com/photo-1577048724846-cd9ff1dcacef
https://images.unsplash.com/photo-1628911771814-5d61388efbf7
https://images.unsplash.com/photo-1620783770629-122b7f187703
https://images.unsplash.com/photo-1590658268037-6bf12165a8df
https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb
https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46
https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1
https://images.unsplash.com/photo-1722439667098-f32094e3b1d4
https://images.unsplash.com/photo-1655560378428-7605bda51749
https://images.unsplash.com/photo-1632200004922-bc18602c79fc
https://images.unsplash.com/photo-1505236273191-1dce886b01e9
https://images.unsplash.com/photo-1615281612781-4b972bd4e3fe
https://images.unsplash.com/photo-1667178173387-7e0cb51c0b4f
https://images.unsplash.com/photo-1574920162043-b872873f19c8
https://images.unsplash.com/photo-1668649176554-3ad841a780d0
https://images.unsplash.com/photo-1598900863662-da1c3e6dd9d9
https://images.unsplash.com/photo-1563014959-7aaa83350992
https://images.unsplash.com/photo-1627989580309-bfaf3e58af6f
https://images.unsplash.com/photo-1619955723484-5c08bc9cd06f
https://images.unsplash.com/photo-1586254116951-5263e2cdb44c
https://images.unsplash.com/photo-1545235616-db3cd822ad8c
https://images.unsplash.com/photo-1624275353151-f21e28a7dfaa
https://images.unsplash.com/photo-1630955539632-7463e7d65b5b
https://images.unsplash.com/photo-1557680784-6db47c6f56ab
https://images.unsplash.com/photo-1591290619618-904f6dd935e3
https://images.unsplash.com/photo-1682828511261-1d481875deb6
`,
  'kitchen-storage': `
https://images.unsplash.com/photo-1678108040468-0cc9addd984d
https://images.unsplash.com/photo-1676907228185-6869277a9f8f
https://images.unsplash.com/photo-1678108429557-546cf9a84c35
https://images.unsplash.com/photo-1678097337340-ec9c74ebf147
https://images.unsplash.com/photo-1522790979484-0ca297a0b0f6
https://images.unsplash.com/photo-1676907229752-ac14b0152b92
https://images.unsplash.com/photo-1676907211346-0f3b752da7b0
https://images.unsplash.com/photo-1676906853781-bdfd8f2e360d
https://images.unsplash.com/photo-1676907125140-5f7a5a6a6859
https://images.unsplash.com/photo-1678097337297-beeb71aad55d
https://images.unsplash.com/photo-1676907225475-f9aea84435ac
https://images.unsplash.com/photo-1678097338862-7f682d54a421
https://images.unsplash.com/photo-1678097339439-eea4ad0578fe
https://images.unsplash.com/photo-1676976500593-3dfec0b17754
https://images.unsplash.com/photo-1676976527022-fdd058e44410
https://images.unsplash.com/photo-1556910096-6f5e72db6803
https://images.unsplash.com/photo-1606859191214-25806e8e2423
https://images.unsplash.com/photo-1609210885099-6ba41569c6dc
https://images.unsplash.com/photo-1565620731358-e8c038abc8d1
https://images.unsplash.com/photo-1591189863345-9db058f9f8ec
https://images.unsplash.com/photo-1682888813734-b1b0a4f79385
https://images.unsplash.com/photo-1654064756668-16a32248d391
https://images.unsplash.com/photo-1648147861003-28013407a037
https://images.unsplash.com/photo-1493710494541-43364cb47485
https://images.unsplash.com/photo-1642497589594-c3e5fc670f39
https://images.unsplash.com/photo-1686820740642-5a1fcd0300a9
https://images.unsplash.com/photo-1556910591-c01184bb213a
https://images.unsplash.com/photo-1682071308392-2e7a285fc11c
https://images.unsplash.com/photo-1676976528790-968650f44264
https://images.unsplash.com/photo-1676976483452-e2ec399fd77f
https://images.unsplash.com/photo-1675092097368-8f18d504de7f
https://images.unsplash.com/photo-1620256182711-9f4a720a86e0
https://images.unsplash.com/photo-1695654671250-71222f4b7372
https://images.unsplash.com/photo-1737682015936-2a40e9379598
https://images.unsplash.com/photo-1514986888952-8cd320577b68
https://images.unsplash.com/photo-1556909211-36987daf7b4d
https://images.unsplash.com/photo-1556185781-a47769abb7ee
https://images.unsplash.com/photo-1452251889946-8ff5ea7b27ab
https://images.unsplash.com/photo-1514237487632-b60bc844a47d
https://images.unsplash.com/photo-1556910585-09baa3a3998e
https://images.unsplash.com/photo-1738484708927-c1f45df0b56e
https://images.unsplash.com/photo-1556910602-38f53e68e15d
https://images.unsplash.com/photo-1518291344630-4857135fb581
https://images.unsplash.com/photo-1586969593928-1c87c1f9c2ef
https://images.unsplash.com/photo-1520981825232-ece5fae45120
https://images.unsplash.com/photo-1556910633-5099dc3971e8
https://images.unsplash.com/photo-1556909172-6ab63f18fd12
https://images.unsplash.com/photo-1730597363352-0a8fe6eb5d12
https://images.unsplash.com/photo-1645567454567-901dc409551b
https://images.unsplash.com/photo-1668911491507-be365acf69ee
https://images.unsplash.com/photo-1576325782957-363cfe40a6d6
https://images.unsplash.com/photo-1613545564258-4eac439cbdfa
https://images.unsplash.com/photo-1669384537114-146673bd410b
https://images.unsplash.com/photo-1768875845344-5663fa9acf15
https://images.unsplash.com/photo-1768876798875-6bedec06ce61
https://images.unsplash.com/photo-1768875836660-ff4eeaa8ffeb
https://images.unsplash.com/photo-1768875828551-2b7e7472be44
https://images.unsplash.com/photo-1617510711388-6f88e078d698
https://images.unsplash.com/photo-1772475385509-bedbdd7b8cbd
https://images.unsplash.com/photo-1776219189056-15335575f274
https://images.unsplash.com/photo-1772475385491-f3cf64d4131a
https://images.unsplash.com/photo-1546507316-bf4c85f0671e
https://images.unsplash.com/photo-1562571708-527276a391ac
https://images.unsplash.com/photo-1543352632-5a4b24e4d2a6
https://images.unsplash.com/photo-1569420077790-afb136b3bb8c
https://images.unsplash.com/photo-1597514402413-17eac2b501c0
https://images.unsplash.com/photo-1616645258469-ec681c17f3ee
https://images.unsplash.com/photo-1543352632-fea6d4f83e78
https://images.unsplash.com/photo-1589010588553-46e8e7c21788
https://images.unsplash.com/photo-1667499745120-f9bcef8f584e
https://images.unsplash.com/photo-1668838268173-816ee121ad4a
https://images.unsplash.com/photo-1556807539-98320ad1e615
https://images.unsplash.com/photo-1569419904069-081571452242
https://images.unsplash.com/photo-1569419852839-ff81b1e41afd
https://images.unsplash.com/photo-1569420050188-564b2986df38
https://images.unsplash.com/photo-1543353071-c953d88f7033
https://images.unsplash.com/photo-1668838225765-daa3a5da6207
https://images.unsplash.com/photo-1570951993722-70be21d0b78b
https://images.unsplash.com/photo-1563696629964-8c3ce077cf3e
https://images.unsplash.com/photo-1646677545665-9b0eef453aea
https://images.unsplash.com/photo-1770990409958-16ed89c1048b
https://images.unsplash.com/photo-1775229943868-fd41531d1d20
https://images.unsplash.com/photo-1623088376771-d5ad9aad3f17
https://images.unsplash.com/photo-1767851522819-8fb10fd7ccb4
https://images.unsplash.com/photo-1775406017830-af4da69f7a64
https://images.unsplash.com/photo-1738162591947-b2694edb2c88
https://images.unsplash.com/photo-1738162596194-85bc216bd957
https://images.unsplash.com/photo-1738162594777-724a66e14be9
https://images.unsplash.com/photo-1767464950620-a3adab78ff31
https://images.unsplash.com/photo-1738162597875-2639006c8442
https://images.unsplash.com/photo-1738162597291-b7bc0ea16079
https://images.unsplash.com/photo-1761233976732-87f2c57a02d7
https://images.unsplash.com/photo-1591632288574-a387f820a1ca
https://images.unsplash.com/photo-1551807306-4bcd16b92a41
https://images.unsplash.com/photo-1612293905838-667dea27cc79
https://images.unsplash.com/photo-1605883705077-8d3d3cebe78c
https://images.unsplash.com/photo-1484632105053-8662f3194e7f
https://images.unsplash.com/photo-1715690998809-11c2a60558fd
https://images.unsplash.com/photo-1534273006427-1686266049b7
https://images.unsplash.com/photo-1620818309896-df4306ec95d8
https://images.unsplash.com/photo-1715690998785-20b918a6392e
https://images.unsplash.com/photo-1551807305-baa15a10803f
https://images.unsplash.com/photo-1732506355953-2d6676f86eec
https://images.unsplash.com/photo-1715690998782-8ae6dd17471e
https://images.unsplash.com/photo-1715690998787-3ccd89b08768
https://images.unsplash.com/photo-1715690998876-e84371b7b9c8
https://images.unsplash.com/photo-1484632152040-840235adc262
`,
  'low-confidence-mix': `
https://images.unsplash.com/photo-1622428051717-dcd8412959de
https://images.unsplash.com/photo-1691480208637-6ed63aac6694
https://images.unsplash.com/photo-1594813591867-02e797aa4581
https://images.unsplash.com/photo-1645871317023-00ca188755de
https://images.unsplash.com/photo-1657041381305-12e765b7444f
https://images.unsplash.com/photo-1580116270858-8a0d62b15426
https://images.unsplash.com/photo-1562918498-5caf8c086007
https://images.unsplash.com/photo-1505576399279-565b52d4ac71
https://images.unsplash.com/photo-1629240830845-e4a550a6bbde
https://images.unsplash.com/photo-1629240811918-d92da93a93ad
https://images.unsplash.com/photo-1669384536024-d091ddc00f4c
https://images.unsplash.com/photo-1633158829875-e5316a358c6f
https://images.unsplash.com/photo-1617854307432-13950e24ba07
https://images.unsplash.com/photo-1663963603322-d51827492f69
https://images.unsplash.com/photo-1645871306587-bebaa2f1dfc0
https://images.unsplash.com/photo-1736697995847-aa0c40c004de
https://images.unsplash.com/photo-1550505393-2c5dbec5de87
https://images.unsplash.com/photo-1579812838194-6e2964204f58
https://images.unsplash.com/photo-1490303518801-b6433e57c353
https://images.unsplash.com/photo-1765530813365-de42bc6a47ca
https://images.unsplash.com/photo-1707276535944-541ed3a21127
https://images.unsplash.com/photo-1759342405113-9ca429c4bbe1
https://images.unsplash.com/photo-1690527434383-cbc859595d7b
https://images.unsplash.com/photo-1658867839109-bf3e2af75cc2
https://images.unsplash.com/photo-1630256252297-e866b55b24da
https://images.unsplash.com/photo-1598888831121-d856c7a9cf40
https://images.unsplash.com/photo-1587293823643-6d8a2a9f3e0e
https://images.unsplash.com/photo-1752051547637-531746ce17c0
https://images.unsplash.com/photo-1605656383818-6a2ad24ef37b
https://images.unsplash.com/photo-1618492409933-20d5624cbf71
https://images.unsplash.com/photo-1591528287446-43c9c0e1075e
https://images.unsplash.com/photo-1591528287637-f3d5eaa83a3c
https://images.unsplash.com/photo-1698505836028-20ea78bad567
https://images.unsplash.com/photo-1639739767611-cc582846849f
https://images.unsplash.com/photo-1589803010842-41cdf85bf0f9
https://images.unsplash.com/photo-1587027768084-c3a9076c0a43
https://images.unsplash.com/photo-1775595224311-abf17728dd44
https://images.unsplash.com/photo-1687898327838-de80103435c1
https://images.unsplash.com/photo-1768742893654-7afa6649f01d
https://images.unsplash.com/photo-1771627278637-10eb2e9857b5
https://images.unsplash.com/photo-1760445799125-b7441f91cc07
https://images.unsplash.com/photo-1516775448597-64ce06b9754e
https://images.unsplash.com/photo-1464890100898-a385f744067f
https://images.unsplash.com/photo-1644682533649-58c09f74b03c
https://images.unsplash.com/photo-1556866149-a42ffe6478ea
https://images.unsplash.com/photo-1546617956-e3deefb51d58
https://images.unsplash.com/photo-1725044047268-d480087e3b25
https://images.unsplash.com/photo-1570129476815-ba368ac77013
https://images.unsplash.com/photo-1552074702-778d9f94af99
https://images.unsplash.com/photo-1474666488182-66ec723476c6
https://images.unsplash.com/photo-1493612276216-ee3925520721
https://images.unsplash.com/photo-1429087969512-1e85aab2683d
https://images.unsplash.com/photo-1505740420928-5e560c06d30e
https://images.unsplash.com/photo-1507608616759-54f48f0af0ee
https://images.unsplash.com/photo-1481349518771-20055b2a7b24
https://images.unsplash.com/photo-1541480601022-2308c0f02487
https://images.unsplash.com/photo-1523049673857-eb18f1d7b578
https://images.unsplash.com/photo-1509281373149-e957c6296406
https://images.unsplash.com/photo-1587590227264-0ac64ce63ce8
https://images.unsplash.com/photo-1459411552884-841db9b3cc2a
https://images.unsplash.com/photo-1497034825429-c343d7c6a68f
https://images.unsplash.com/photo-1494232410401-ad00d5433cfa
https://images.unsplash.com/photo-1501426026826-31c667bdf23d
https://images.unsplash.com/photo-1598300042247-d088f8ab3a91
https://images.unsplash.com/photo-1720572742865-b57ccc2df130
https://images.unsplash.com/photo-1581068466660-e6585b8afa97
https://images.unsplash.com/photo-1727870752547-6d2298338804
https://images.unsplash.com/photo-1633155569326-8f0899e20f9c
https://images.unsplash.com/photo-1722084060100-94d9414629e2
https://images.unsplash.com/photo-1752981560877-8f18ab9c2787
https://images.unsplash.com/photo-1764185826281-fecec29aa5b1
https://images.unsplash.com/photo-1773558058381-97ac2e8ab2ff
https://images.unsplash.com/photo-1772546553716-223166b787d2
https://images.unsplash.com/photo-1776083760621-837cd573ed6e
https://images.unsplash.com/photo-1776191707298-6e5b42b51940
https://images.unsplash.com/photo-1761807997279-26ce9256bc56
https://images.unsplash.com/photo-1772920908589-d6264e5d987f
https://images.unsplash.com/photo-1768573489812-1697ffb73f4e
https://images.unsplash.com/photo-1426927308491-6380b6a9936f
https://images.unsplash.com/photo-1599256630445-67b5772b1204
https://images.unsplash.com/photo-1671040690726-b78261eff126
https://images.unsplash.com/photo-1637640125496-31852f042a60
https://images.unsplash.com/photo-1731694411560-050e5b91e943
https://images.unsplash.com/photo-1683115099413-5b7d85c2950c
https://images.unsplash.com/photo-1549636367-13c144c47063
https://images.unsplash.com/photo-1599256631012-9c2b32bfa8bc
https://images.unsplash.com/photo-1514443031610-8c063c7a9822
https://images.unsplash.com/photo-1668874184010-87aa286683dd
https://images.unsplash.com/photo-1671040726131-746880d06bb5
https://images.unsplash.com/photo-1683115098516-9b8d5c643b5b
https://images.unsplash.com/photo-1599651971621-7c42aaa20cd2
https://images.unsplash.com/photo-1530124566582-a618bc2615dc
https://images.unsplash.com/photo-1567361808960-dec9cb578182
https://images.unsplash.com/photo-1522832712787-3fbd36c9fe2d
https://images.unsplash.com/photo-1586864387789-628af9feed72
https://images.unsplash.com/photo-1558906050-d6d6aa390fd3
https://images.unsplash.com/photo-1606676539940-12768ce0e762
https://images.unsplash.com/photo-1585569695919-db237e7cc455
https://images.unsplash.com/photo-1645072773972-d6f591c8d21d
https://images.unsplash.com/photo-1657776655487-18dcab7b2c65
https://images.unsplash.com/photo-1599692987969-b2389dedca7f
https://images.unsplash.com/photo-1708441434498-349b0b5dc8d8
https://images.unsplash.com/photo-1467139840664-96b244a66825
https://images.unsplash.com/photo-1452860606245-08befc0ff44b
https://images.unsplash.com/photo-1554995207-c18c203602cb
https://images.unsplash.com/photo-1616047006789-b7af5afb8c20
https://images.unsplash.com/photo-1616046229478-9901c5536a45
https://images.unsplash.com/photo-1560448204-e02f11c3d0e2
https://images.unsplash.com/photo-1489274495757-95c7c837b101
https://images.unsplash.com/photo-1654064756910-974764816931
https://images.unsplash.com/photo-1560185007-cde436f6a4d0
https://images.unsplash.com/photo-1612196808827-9ff25cb6137a
https://images.unsplash.com/photo-1543248939-4296e1fea89b
https://images.unsplash.com/photo-1667312939978-64cf31718a6e
https://images.unsplash.com/photo-1650229068182-6931ccb389c2
https://images.unsplash.com/photo-1740803292822-a742c6a4fef0
https://images.unsplash.com/photo-1660997598847-bdad1ad226c7
https://images.unsplash.com/photo-1604762433261-a046add6fc11
https://images.unsplash.com/photo-1603527413520-73e05f787ee3
https://images.unsplash.com/photo-1517457210348-703079e57d4b
`,
};

function parsePool(raw) {
  return raw
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.startsWith('https://images.unsplash.com/photo-'));
}

function dedup(arr) {
  return Array.from(new Set(arr));
}

const usedAcrossScenarios = new Set();
const stats = [];
const scenarios = SCENARIOS_META.map((meta) => {
  const raw = parsePool(RAW_PHOTOS[meta.id] || '');
  const deduped = dedup(raw);
  // 跨 scenario 不挑出已用過的(避免同張照片分到兩個場景顯得 weird)
  const photos = deduped.filter((u) => !usedAcrossScenarios.has(u));
  photos.forEach((u) => usedAcrossScenarios.add(u));
  stats.push({ id: meta.id, raw: raw.length, deduped: deduped.length, kept: photos.length });
  return { ...meta, photos };
});

const out = { scenarios };
const outPath = path.resolve(__dirname, '..', 'src', 'services', 'fixtures', 'detectionFixtures.json');
fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n', 'utf-8');

console.log('Built photoLibrary into', path.relative(process.cwd(), outPath));
console.table(stats);
console.log('Total photos:', usedAcrossScenarios.size);
