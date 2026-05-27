/**
 * jest 環境 stub — 任何 require('*.jpg|png|...') 在測試裡都回這個假 asset id。
 * Metro / RN 真實情況會回一個 module ID (number)，這裡只需要型別相容即可。
 */
export default 1;
module.exports = 1;
