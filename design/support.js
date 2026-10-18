// 로컬 확인용 최소 렌더러 (캔버스 런타임 흉내) — 퍼블리시하지 않음
(function () {
  class DCLogic {
    constructor(props) { this.props = props || {}; this.state = {}; }
    setState(p) { Object.assign(this.state, p); window.__dcRender && window.__dcRender(); }
  }
  const evalIn = (expr, scope) => {
    const keys = Object.keys(scope);
    return new Function(...keys, 'return (' + expr + ');')(...keys.map((k) => scope[k]));
  };
  const subst = (str, scope) => str.replace(/\{\{([\s\S]+?)\}\}/g, (_, e) => {
    const v = evalIn(e, scope); return v == null ? '' : String(v);
  });
  function proc(node, scope, out) {
    if (node.nodeType === 3) { out.push(document.createTextNode(subst(node.nodeValue, scope))); return; }
    if (node.nodeType !== 1) return;
    const tag = node.tagName.toLowerCase();
    if (tag === 'sc-for') {
      const list = evalIn(node.getAttribute('list').replace(/^\{\{|\}\}$/g, ''), scope) || [];
      const as = node.getAttribute('as');
      list.forEach((item) => node.childNodes.forEach((c) => proc(c, Object.assign({}, scope, { [as]: item }), out)));
      return;
    }
    if (tag === 'sc-if') {
      if (evalIn(node.getAttribute('value').replace(/^\{\{|\}\}$/g, ''), scope)) node.childNodes.forEach((c) => proc(c, scope, out));
      return;
    }
    const el = node.cloneNode(false);
    for (const a of Array.from(node.attributes)) {
      if (/^on/i.test(a.name)) {
        el.removeAttribute(a.name);
        const m = a.value.match(/^\{\{([\s\S]+)\}\}$/);
        if (m) { const fn = evalIn(m[1], scope); el.addEventListener(a.name.slice(2).toLowerCase(), (ev) => fn && fn(ev)); }
      } else if (a.value.includes('{{')) {
        el.setAttribute(a.name, subst(a.value, scope));
      }
    }
    const kids = [];
    (node.content || node).childNodes.forEach((c) => proc(c, scope, kids));
    kids.forEach((k) => el.appendChild(k));
    out.push(el);
  }
  document.addEventListener('DOMContentLoaded', () => {
    const xdc = document.querySelector('x-dc');
    const helmet = xdc.querySelector('helmet');
    if (helmet) { Array.from(helmet.children).forEach((c) => document.head.appendChild(c)); helmet.remove(); }
    const tpl = document.createElement('template');
    tpl.innerHTML = xdc.innerHTML;
    const code = document.querySelector('script[type="text/x-dc"]').textContent;
    const Comp = new Function('DCLogic', code + '\n;return Component;')(DCLogic);
    const comp = new Comp({});
    const host = document.createElement('div');
    xdc.replaceWith(host);
    window.__dcRender = () => {
      const vals = comp.renderVals();
      const out = [];
      tpl.content.childNodes.forEach((c) => proc(c, vals, out));
      host.replaceChildren(...out);
    };
    window.__dcRender();
  });
})();
