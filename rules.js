(function (root) {
  'use strict';
  const rules = [
    ['exact','完全相同','保留原名，或在前后附加显著性低的通用词。','白兔 → 白兔','附加通用词候选单独标注，需人工核对。'],
    ['reverse','逆序','全部字符按相反顺序排列。','白兔 → 兔白'],
    ['replace','变汉字','至少 3 个汉字，恰好替换 1 个字，长度不变。','大白兔 → 大百兔','两字名称不执行此项。'],
    ['remove','减汉字','删除 1 个汉字，其他字保持原顺序。','大白兔 → 白兔、大兔、大白'],
    ['reorder','换序','重新排列原有字符，不增加、不减少，排除原名。','白兔先生 → 兔白先生'],
    ['partial','部分相同','保留原位置的部分字并替换其余字，或提取连续部分。','途虎 → 途狐、猛虎；白兔奶糖 → 白兔','两类共用 50 条额度；连续提取至少 2 字。'],
    ['insert','任意位置加汉字','在任意位置恰好增加 1 个汉字。','白兔 → 大白兔、白小兔、白兔王'],
    ['shape','形似','替换为字形或结构相近的汉字。','白兔 → 白免、柏兔','展示模型给出的字形依据，需要人工核对。'],
    ['english','英文相同','生成对应的英文名称或英文含义。','白兔 → WHITE RABBIT','含义需人工核对；大小写或空格变化不计为不同名称。'],
    ['contains','含在其它商标中','生成连续包含完整原名的更长名称。','白兔 → 大白兔、开心白兔、白兔优选','候选不表示真实存在的注册商标。'],
    ['sound','读音相同','按不区分声调的拼音匹配，包含多音字读音。','白兔 → BAI TU、柏途、佰兔','逐字词典校验并显示所用读音，多音字语境需人工核对。']
  ].map(([id,label,description,example,extra=''])=>({id,label,description,example,extra}));
  const normalize = name => name.normalize('NFKC').trim().replace(/\s+/gu,' ');
  const key = name => normalize(name).toUpperCase();
  function validate(name, ids) {
    if (typeof name !== 'string' || !name.trim()) return '请输入商标名称。';
    if ([...normalize(name)].length > 30) return '商标名称最多支持 30 个字符。';
    if (/[\p{Cc}\p{Cf}]/u.test(name)) return '名称不能包含换行、控制字符或隐藏字符。';
    if (!Array.isArray(ids) || !ids.length) return '请至少选择一项近似规则。';
    if (ids.some(id=>!rules.some(rule=>rule.id===id))) return '包含未知规则，请重新选择。';
    return '';
  }
  const api = {rules,normalize,key,validate};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Trademark = api;
})(globalThis);
