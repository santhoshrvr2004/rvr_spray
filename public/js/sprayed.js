/* ===========================================================================
   RVR RAMDUKES DTFS — geometry constants below were measured from the
   supplied glb files, not estimated.
   =========================================================================== */
(function () {
"use strict";

/* ------------------------------------------------------ refresh behaviour
   On a browser refresh/reload, always restart the cinematic page at the top.
   Normal in-page scrolling and normal navigation are left unchanged. */
var NAV_ENTRY = (performance.getEntriesByType && performance.getEntriesByType("navigation")[0]) || null;
var IS_PAGE_RELOAD = NAV_ENTRY
  ? NAV_ENTRY.type === "reload"
  : !!(performance.navigation && performance.navigation.type === 1);

if (IS_PAGE_RELOAD) {
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  var forceReloadTop = function () {
    window.scrollTo(0, 0);
  };

  forceReloadTop();
  addEventListener("pageshow", function () {
    forceReloadTop();
    requestAnimationFrame(forceReloadTop);
    setTimeout(forceReloadTop, 0);
  });
}

var RED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
var lerp = function (a, b, t) { return a + (b - a) * t; };
var ease = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
var fmt = function (n, d) { return (+n).toLocaleString("en-US", { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); };

/* ------------------------------------------------------------- measured */
var GEO = {
  sprayPlaneX: 1.02745,   // vertical plane the web runs up, midway between banks
  bankAX: 1.36090,
  bankBX: 0.69400,
  nozzleY: 0.98960,
  pitch: 0.18180,         // m, exact and identical on both banks
  standoff: 0.24540,      // m, nozzle tip to web
  webWidth: 2.000,        // m
  nozzlesPerBank: 12
};

/* --------------------------------------------------------------- groups */
/* first match wins */
var GROUPS = [
  { k: "FABRIC", n: "Fabric web",       re: /^Part129/i },
  { k: "NOZZLE", n: "Spray nozzles",    re: /ductAA250AUH/i },
  { k: "TILT",   n: "Tilt actuators",   re: /ADNGF_32_80|32 x80|Cylinder Mounting Clamp|Cylinder Main Clamp|festo mounting/i },
  { k: "RAIL",   n: "Guide rails",      re: /WW_10_40|WS_10_40/i },
  { k: "DUCT",   n: "Ducts & manifolds",re: /Spramy Main Pipe|Solenoid Duct|Main Duct|Drain Duct|Duct Clam/i },
  { k: "TANK",   n: "Liquor tank",      re: /tank/i },
  { k: "PUMP",   n: "Pump",             re: /Pressure Pump/i },
  { k: "DOSE",   n: "Dosing circuit",   re: /DAPS|VZBA|Ball valve|Strainer|pressuer sensor|GP-M|Valve/i },
  { k: "FEED",   n: "Pipework",         re: /flange|bush|collar|coller|reducer|bend|BEND|pipe|100 mm|catlog|adustable|50 dia|31\.03/i },
  { k: "ELEC",   n: "Control cabinet",  re: /Electrical control box|panel box|panel mounting|Electric box|acrylic|glass/i },
  { k: "FRAME",  n: "Frame & fixings",  re: /./ }
];
var GNAME = {};
GROUPS.forEach(function (g) { GNAME[g.k] = g.n; });
function groupOf(name) {
  for (var i = 0; i < GROUPS.length; i++) if (GROUPS[i].re.test(name)) return GROUPS[i].k;
  return "FRAME";
}
/* explode: direction + reach per group, so parts separate by function */
var EXP = {
  FABRIC: { d: [0, 0, 0], a: 0 },
  NOZZLE: { d: null,      a: 1.00 },   // null = outward from the spray plane
  DUCT:   { d: [0, 1, 0], a: 0.55 },
  TILT:   { d: [0, 1, 0], a: 1.05 },
  RAIL:   { d: [0, 1, 0], a: 1.55 },
  TANK:   { d: [0, -1, 0], a: 0.75 },
  PUMP:   { d: [0, -1, 0], a: 1.30 },
  DOSE:   { d: [0, 0, 1], a: 1.00 },
  FEED:   { d: [0, 0, -1], a: 0.72 },
  ELEC:   { d: [1, 0, 0], a: 1.05 },
  FRAME:  { d: [0, -1, 0], a: 0.42 }
};

/* ------------------------------------------------------------- chapters */
/* t = target in ORIGINAL metres · az/el degrees · d scene units · f = focus groups */
var CH = [
  /* 1 · SPRAY ASSEMBLY — first appearance / overview */
  { id:"c-hero",   m:"m", v: 8, t:[0.440, 0.543,-1.406], az: 44, el: 14, d:20, side:"l", exp:0, f:null, pins:[] },
  { id:"c-line",   m:"m", v:14, t:[0.440, 0.543,-1.406], az: 18, el: 10, d:16, side:"l", exp:0, f:null, pins:[] },

  /* 2 · SAME SPRAY ASSEMBLY — four functional part-focus chapters */
  { id:"c-frame",  m:"m", v:18, t:[0.440, 0.543,-1.406], az:-44, el: -8, d:13, side:"r", exp:0, f:["FRAME"], pins:[] },
  // { id:"c-tank",   m:"m", v:22, t:[0.250, 0.360,-1.420], az:128, el:  8, d:10, side:"l", exp:0, f:["TANK"], pins:[] },
  // { id:"c-pump",   m:"m", v:26, t:[-0.150,0.050,-1.250], az:152, el:-16, d:9,  side:"r", exp:0, f:["PUMP","FEED"], pins:[] },
  // { id:"c-dose",   m:"m", v:30, t:[0.900, 0.240,-1.650], az:-62, el: 10, d:9,  side:"l", exp:0, f:["DOSE"], pins:[] },

  /* 3 · SPRAY DUCT SUBASSEMBLY */
  // { id:"c-elec",   m:"d", v:34, t:[0.999, 1.000, 0.237], az:-70, el: 10, d:13, side:"r", exp:0, f:null, pins:[] },
  { id:"c-duct",   m:"d", v:40, t:[0.999, 1.000, 0.237], az: 36, el: 18, d:15, side:"l", exp:0, f:null, pins:[
      { p:[1.361, 0.990, 1.100], t:"Bank A", e:"12 nozzles", u:"" },
      { p:[0.694, 0.990,-0.660], t:"Bank B", e:"mirrored", u:"667 mm apart", f:1 } ] },
  // { id:"c-pipe",   m:"d", v:44, t:[1.401, 0.953, 0.284], az: 22, el: 14, d:10, side:"r", exp:0, f:["DUCT"], pins:[
  //     { p:[1.401, 0.953, 1.300], t:"Main pipe", e:"Spramy, 2 269 mm", u:"feeds 12" } ] },
  // { id:"c-sol",    m:"d", v:48, t:[1.366, 0.961, 0.237], az:-34, el: 16, d:9,  side:"l", exp:0, f:["DUCT"], pins:[
      // { p:[1.366, 1.020,-0.700], t:"Solenoid duct", e:"Ex2026, 2 400 mm", u:"one valve per nozzle" } ] },
  { id:"c-noz",    m:"d", v:54, t:[1.027, 0.990, 0.147], az:  2, el:  6, d:7,  side:"r", exp:0, f:["NOZZLE"], pins:[
      { p:[1.361, 0.990, 0.147], t:"AA250AUH", e:"bank A", u:"pitch 181.8 mm" },
      { p:[0.694, 0.990, 0.510], t:"Facing bank", e:"245 mm standoff", u:"", f:1 } ] },

  /* 4 · NOZZLE CLOSE-UP */
  { id:"c-nozzle", m:"n", v:58, t:[0.088, 0.000, 0.011], az: 34, el: 12, d:13, side:"l", exp:0, f:null, pins:[] },

  /* 5 · RETURN TO SPRAY ASSEMBLY */
  // { id:"c-tilt",   m:"m", v:62, t:[0.450, 0.820,-1.400], az: 72, el: 22, d:9,  side:"r", exp:0, f:["TILT"], pins:[] },
  { id:"c-rail",   m:"m", v:66, t:[0.440, 0.650,-1.420], az:-72, el: 32, d:11, side:"l", exp:0, f:["RAIL"], pins:[] },
  // { id:"c-exp",    m:"m", v:70, t:[0.440, 0.543,-1.406], az: 32, el: 20, d:24, side:"r", exp:1, f:null, pins:[] },
  { id:"c-full",   m:"m", v:80, t:[0.440, 0.543,-1.406], az: 26, el: 16, d:20, side:"l", exp:0, f:null, pins:[] }
];

/* ============================================================== STATE */
var S = {
  ghost:true, exp:false, expAmt:.55, spray:false, cut:false, cutPos:.5, heavy:true, wire:false,
  drag:0, tilt:0, dz:0, dragging:false, iso:null, loaded:false,
  speed:8, chIdx:0, matDirty:true, focus:null
};

/* ============================================================ PROCESS MODEL */
var NOZ = { q0: 0.40, p0: 2.5 };                     // L/min per nozzle at 2.5 bar
function nozzleFlow(pr) { return NOZ.q0 * Math.sqrt(pr / NOZ.p0); }
function requiredFlow(add, width, spd) { return add * width * spd / 1000; }   // L/min
function dutyAt(spd, add, pr, n, width) {
  var need = requiredFlow(add, width, spd);
  var cap = n * nozzleFlow(pr);
  return cap > 0 ? need / cap : 1;
}
function maxSpeed(add, pr, n, width) {
  return n * nozzleFlow(pr) * 1000 / Math.max(add * width, 1e-6);
}
function vmd(pr) { return 90 * Math.pow(2.5 / pr, 0.45); }                    // µm

/* deposition profile across the width, summed from every nozzle */
function profile(opt) {
  var pitch = opt.pitch, stand = opt.stand, ang = opt.ang, stagger = opt.stagger || 0;
  var n = GEO.nozzlesPerBank;
  var w = stand * Math.tan(ang * Math.PI / 360);       // half-width of one fan at the cloth
  var span = (n - 1) * pitch;
  var zs = [];                                          /* bank A sprays face 1 */
  for (var i = 0; i < n; i++) zs.push({ z: -span / 2 + i * pitch, b: 0 });
  for (var i2 = 0; i2 < n; i2++) zs.push({ z: -span / 2 + i2 * pitch + stagger * pitch, b: 1 });
  var fan = function (x, z) { return Math.exp(-Math.pow(Math.abs(x - z) / Math.max(w, 1e-6), 2.6)); };
  var half = GEO.webWidth * 1000 / 2;
  var N = 401, xs = [], ys = [], yt = [];
  var inWeb = 0, total = 0;
  for (var k = 0; k < N; k++) {
    var x = -half * 1.18 + (2 * half * 1.18) * k / (N - 1), a = 0, b = 0;
    for (var j = 0; j < zs.length; j++) {
      if (zs[j].b) b += fan(x, zs[j].z); else a += fan(x, zs[j].z);
    }
    xs.push(x); ys.push(a); yt.push(a + b);
    total += a;
    if (x >= -half && x <= half) inWeb += a;
  }
  function stats(arr) {
    var sum = 0, c = 0, mn = 1e9, mx = -1e9;
    for (var i3 = 0; i3 < N; i3++) {
      if (Math.abs(xs[i3]) < half * 0.9) { sum += arr[i3]; c++; mn = Math.min(mn, arr[i3]); mx = Math.max(mx, arr[i3]); }
    }
    var mean = c ? sum / c : 0, v = 0;
    for (var i4 = 0; i4 < N; i4++) if (Math.abs(xs[i4]) < half * 0.9) v += Math.pow(arr[i4] - mean, 2);
    return { mean: mean, min: mn, max: mx,
             cv: mean > 0 ? Math.sqrt(v / Math.max(c, 1)) / mean * 100 : 0,
             pv: mean > 0 ? (mx - mn) / mean * 100 : 0 };
  }
  var A = stats(ys), T = stats(yt);
  return {
    xs: xs, ys: ys, yt: yt, zs: zs, w: w, fan: fan,
    mean: A.mean, min: A.min, max: A.max, cv: A.cv, pv: A.pv,
    totCv: T.cv, totMean: T.mean, totMax: T.max,
    overlap: 2 * w / pitch,
    edge: total > 0 ? (1 - inWeb / total) * 100 : 0
  };
}

/* savings against a pad-mangle */
function savings(g) {
  var W = GEO.webWidth;
  var cloth = g.gsm * W * g.spd / 1000;              // kg/min of fabric
  var padL = cloth * g.pad / 100, sprL = cloth * g.spr / 100;
  var dW = (padL - sprL) * 60;                        // kg/h of water not applied
  var MJ = dW * 2.60 / 0.60;                          // latent + sensible / stenter efficiency
  return {
    padLh: padL * 60, sprLh: sprL * 60, water: dW,
    kW: MJ / 3.6, MJ: MJ, gas: MJ / 35.8, co2: (MJ / 35.8) * 2.03,
    pct: padL > 0 ? (1 - sprL / padL) * 100 : 0
  };
}

/* ============================================================ STRIP */
var stripCv = $("#stripCv"), sctx = stripCv.getContext("2d"), sW = 0, sH = 0;
function sizeStrip() {
  var r = stripCv.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
  sW = r.width; sH = r.height;
  stripCv.width = Math.max(1, sW * dpr); stripCv.height = Math.max(1, sH * dpr);
  sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
var stripProf = null;
function drawStrip(spd) {
  if (!sW) return;
  if (!stripProf) stripProf = profile({ pitch: U.pitch, stand: U.stand, ang: U.ang, stagger: U.stagger / 100 });
  var P = stripProf;
  var pad = { l: 8, r: 8, t: 15, b: 11 }, w = sW - pad.l - pad.r, h = sH - pad.t - pad.b;
  sctx.clearRect(0, 0, sW, sH);
  var half = GEO.webWidth * 1000 / 2 * 1.18;
  var X = function (x) { return pad.l + (x + half) / (2 * half) * w; };
  var mxv = P.max * 1.30;
  var Y = function (v) { return pad.t + h - v / mxv * h; };

  /* web edges */
  var e0 = X(-GEO.webWidth * 500), e1 = X(GEO.webWidth * 500);
  sctx.fillStyle = "rgba(12,140,160,.07)"; sctx.fillRect(e0, pad.t, e1 - e0, h);
  sctx.strokeStyle = "rgba(12,140,160,.40)"; sctx.lineWidth = 1;
  [e0, e1].forEach(function (x) { sctx.beginPath(); sctx.moveTo(x, pad.t - 3); sctx.lineTo(x, pad.t + h); sctx.stroke(); });

  /* individual fans, faint */
  sctx.strokeStyle = "rgba(220,30,107,.18)"; sctx.lineWidth = 1;
  P.zs.forEach(function (nz) {
    if (nz.b) return;
    sctx.beginPath();
    for (var i = 0; i < P.xs.length; i += 3) sctx.lineTo(X(P.xs[i]), Y(P.fan(P.xs[i], nz.z)));
    sctx.stroke();
  });

  /* summed profile, filled */
  sctx.beginPath(); sctx.moveTo(X(P.xs[0]), Y(0));
  for (var i2 = 0; i2 < P.xs.length; i2++) sctx.lineTo(X(P.xs[i2]), Y(P.ys[i2]));
  sctx.lineTo(X(P.xs[P.xs.length - 1]), Y(0)); sctx.closePath();
  var g = sctx.createLinearGradient(0, pad.t, 0, pad.t + h);
  g.addColorStop(0, "rgba(220,30,107,.34)"); g.addColorStop(1, "rgba(220,30,107,.03)");
  sctx.fillStyle = g; sctx.fill();
  sctx.beginPath();
  for (var i3 = 0; i3 < P.xs.length; i3++) {
    var xx = X(P.xs[i3]), yy = Y(P.ys[i3]);
    if (i3 === 0) sctx.moveTo(xx, yy); else sctx.lineTo(xx, yy);
  }
  sctx.strokeStyle = "#DC1E6B"; sctx.lineWidth = 1.6; sctx.stroke();

  /* mean line */
  sctx.beginPath(); sctx.moveTo(e0, Y(P.mean)); sctx.lineTo(e1, Y(P.mean));
  sctx.strokeStyle = "rgba(15,21,29,.26)"; sctx.setLineDash([3, 3]); sctx.lineWidth = 1;
  sctx.stroke(); sctx.setLineDash([]);

  /* nozzle ticks */
  sctx.fillStyle = "rgba(12,140,160,.65)";
  P.zs.forEach(function (nz) { if (!nz.b) sctx.fillRect(X(nz.z) - 1, pad.t + h - 3, 2, 3); });
}

/* ============================================================ THREE */
var canvas = $("#gl"), renderer, scene, camera, envMap, clipPlane, raycaster;
var MODEL = {}, META = {}, allMats = [], sprayFX = {};
var CHEM = null, COOL = null;

function initThree() {
  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 0);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.localClippingEnabled = true;
  renderer.sortObjects = true;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(31, 1, 0.05, 500);
  camera.position.set(16, 9, 20);
  raycaster = new THREE.Raycaster();
  CHEM = new THREE.Color(0xDC1E6B);
  COOL = new THREE.Color(0xA6B2BF);

  /* bright softbox studio — light walls above, a mid-grey sweep below so the
     stainless still reads against a pale page */
  var c = document.createElement("canvas"); c.width = 1024; c.height = 512;
  var x = c.getContext("2d");
  var g = x.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, "#FFFFFF"); g.addColorStop(.40, "#E7ECF1");
  g.addColorStop(.52, "#AEB8C3"); g.addColorStop(1, "#6C7784");
  x.fillStyle = g; x.fillRect(0, 0, 1024, 512);
  x.globalAlpha = 1; x.fillStyle = "#ffffff";
  x.fillRect(70, 10, 300, 120); x.fillRect(420, 16, 210, 104); x.fillRect(700, 12, 270, 116);
  x.globalAlpha = .30; x.fillStyle = "#8894A3"; x.fillRect(0, 316, 1024, 96);
  x.globalAlpha = .16; x.fillStyle = "#FF9EC6"; x.fillRect(600, 150, 200, 150);
  var tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  var pm = new THREE.PMREMGenerator(renderer); pm.compileEquirectangularShader();
  envMap = pm.fromEquirectangular(tex).texture; pm.dispose(); tex.dispose();
  scene.environment = envMap;

  scene.add(
    lit(0xffffff, 2.30, [10, 14, 11]), lit(0xCFE2F2, .55, [-12, 5, -9]),
    lit(0xFFD6E6, .60, [-5, -5, -12]), new THREE.HemisphereLight(0xFFFFFF, 0x9AA6B4, .55)
  );
  renderer.toneMappingExposure = 0.94;
  clipPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 40);

  var sc = document.createElement("canvas"); sc.width = sc.height = 256;
  var sx = sc.getContext("2d");
  var sg = sx.createRadialGradient(128, 128, 0, 128, 128, 128);
  sg.addColorStop(0, "rgba(255,255,255,.9)"); sg.addColorStop(.5, "rgba(255,255,255,.28)");
  sg.addColorStop(1, "rgba(255,255,255,0)");
  sx.fillStyle = sg; sx.fillRect(0, 0, 256, 256);
  window.__sh = new THREE.Mesh(new THREE.PlaneGeometry(34, 26),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, color: 0x2A3644, depthWrite: false, opacity: .30 }));
  window.__sh.rotation.x = -Math.PI / 2;
  window.__sh.position.y = -6.6;
  scene.add(window.__sh);
}
function lit(col, i, p) { var l = new THREE.DirectionalLight(col, i); l.position.set(p[0], p[1], p[2]); return l; }

/* --------------------------------------------------------------- ingest */
function ingest(gltfScene, key, targetSize, fixedScale) {
  var inner = gltfScene;
  /* measured while unscaled, so every centre is in the file's own metres */
  inner.updateMatrixWorld(true);
  var box = new THREE.Box3().setFromObject(inner);
  var ctr = box.getCenter(new THREE.Vector3());
  var size = box.getSize(new THREE.Vector3());
  var S0 = fixedScale || (targetSize / Math.max(size.x, size.y, size.z));

  var meshes = [], tris = 0, mats = {};
  inner.traverse(function (o) {
    if (!o.isMesh) return;
    o.material = o.material.clone();
    o.material.envMapIntensity = 1.1;
    o.material.transparent = true;          /* set once — never toggled per frame */
    o.material.depthWrite = true;
    o.material.clippingPlanes = [];
    allMats.push(o.material);
    var g2 = o.geometry;
    if (!g2.boundingBox) g2.computeBoundingBox();
    var t = g2.index ? g2.index.count / 3 : g2.attributes.position.count / 3;
    tris += t;
    o.userData.grp = groupOf(o.name);
    o.userData.tri = t;
    o.userData.baseColor = o.material.color.clone();
    o.userData.baseMetal = o.material.metalness;
    o.userData.baseRough = o.material.roughness;
    o.userData.op = 1; o.userData.tn = 0;
    o.userData.heavy = /M16 Bolt|hex bolt/i.test(o.name);
    o.renderOrder = 0;
    mats[o.material.name || "m"] = 1;
    meshes.push(o);
  });

  var wb = new THREE.Box3();
  meshes.forEach(function (o) {
    wb.setFromObject(o);
    o.userData.mCtr = wb.getCenter(new THREE.Vector3()).clone();
    o.userData.size = wb.getSize(new THREE.Vector3()).clone();
  });

  var group = new THREE.Group();
  group.add(inner);
  group.scale.setScalar(S0);
  group.position.copy(ctr).multiplyScalar(-S0);
  group.visible = (key === "m");
  scene.add(group);

  var m = { inner: inner, group: group, meshes: meshes, tris: tris, scale: S0,
            ctr: ctr.clone(), size: size.clone(), mats: Object.keys(mats).length, fade: key === "m" ? 1 : 0 };
  MODEL[key] = group; META[key] = m;

  /* explode vectors, grouped so parts move together */
  var reach = Math.max(size.x, size.y, size.z) * 0.30;
  meshes.forEach(function (o) {
    var e = EXP[o.userData.grp] || EXP.FRAME, d;
    if (e.d === null) {
      d = new THREE.Vector3(o.userData.mCtr.x >= GEO.sprayPlaneX ? 1 : -1, 0.12, 0).normalize();
    } else {
      d = new THREE.Vector3(e.d[0], e.d[1], e.d[2]);
      if (d.lengthSq() < 1e-9) d.set(0, 0, 0); else d.normalize();
    }
    o.userData.expV = d.multiplyScalar(e.a * reach);
    o.userData.base = o.position.clone();
  });

  buildSpray(key);
  return m;
}

/* --------------------------------------------------------- spray droplets */
function buildSpray(key) {
  var m = META[key];
  var noz = m.meshes.filter(function (o) { return o.userData.grp === "NOZZLE"; });
  if (!noz.length) return;

  /* The duct GLB and the full spray-assembly GLB use different X origins.
     Derive the centre plane from the actual nozzle banks in the active GLB.
     This keeps BOTH banks spraying inward toward the fabric instead of letting
     one bank spray outward on the full assembly (visible on chapters 06/07). */
  var minNozzleX = Infinity, maxNozzleX = -Infinity;
  noz.forEach(function (o) {
    minNozzleX = Math.min(minNozzleX, o.userData.mCtr.x);
    maxNozzleX = Math.max(maxNozzleX, o.userData.mCtr.x);
  });
  var sprayPlaneX = (minNozzleX + maxNozzleX) * 0.5;

  var per = 26, N = noz.length * per;
  var pos = new Float32Array(N * 3), seed = new Float32Array(N);
  var src = [];
  noz.forEach(function (o) {
    var c = o.userData.mCtr;
    var dir = c.x >= sprayPlaneX ? -1 : 1;
    src.push({ x: c.x + dir * o.userData.size.x * 0.42, y: c.y, z: c.z, dir: dir });
  });
  for (var i = 0; i < N; i++) seed[i] = Math.random();
  var geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  var mat = new THREE.PointsMaterial({
    color: 0xDC1E6B, size: 0.05, transparent: true, opacity: .0,
    depthWrite: false, sizeAttenuation: true
  });
  var pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  pts.renderOrder = 5;
  m.inner.add(pts);
  sprayFX[key] = { pts: pts, geo: geo, mat: mat, src: src, per: per, seed: seed, N: N };
}
function updateSpray(key, dt, on) {
  var fx = sprayFX[key]; if (!fx) return;
  var target = on ? .72 : 0;
  fx.mat.opacity += (target - fx.mat.opacity) * Math.min(1, dt * 4);
  if (fx.mat.opacity < .004) { fx.pts.visible = false; return; }
  fx.pts.visible = true;
  var p = fx.geo.attributes.position.array, i = 0;
  var reach = GEO.standoff, spread = Math.tan(65 * Math.PI / 360);
  var t = performance.now() / 1000;
  for (var s = 0; s < fx.src.length; s++) {
    var o = fx.src[s];
    for (var k = 0; k < fx.per; k++) {
      var sd = fx.seed[i / 3];
      var u = ((t * (0.9 + sd * 0.5) + sd * 3.7) % 1);
      var a = sd * 6.2831 + s;
      var r = u * reach;
      var sp = u * reach * spread * (0.35 + sd * 0.85);
      p[i]     = o.x + o.dir * r;
      p[i + 1] = o.y + Math.sin(a) * sp * 0.55;
      p[i + 2] = o.z + Math.cos(a) * sp;
      i += 3;
    }
  }
  fx.geo.attributes.position.needsUpdate = true;
}

/* ============================================================ MATERIALS */
var GHOST_OP = 0.20;
function markDirty() { S.matDirty = true; }
function updateMaterials(k) {
  if (!S.matDirty) return;
  var moving = 0;
  var focus = S.iso ? [S.iso] : S.focus;
  var hasFocus = S.ghost && focus && focus.length;
  Object.keys(META).forEach(function (key) {
    var m = META[key];
    var vis = m.fade > 0.012;
    MODEL[key].visible = vis;
    if (!vis) return;
    for (var i = 0; i < m.meshes.length; i++) {
      var o = m.meshes[i], u = o.userData;
      var isF = hasFocus && focus.indexOf(u.grp) >= 0;
      var opT = !hasFocus ? 1 : (isF ? 1 : GHOST_OP);
      var tnT = isF ? 1 : 0;
      var d1 = opT - u.op, d2 = tnT - u.tn;
      if (Math.abs(d1) > 0.002 || Math.abs(d2) > 0.002) moving++;
      u.op += d1 * k; u.tn += d2 * k;
      var op = u.op * m.fade;
      o.material.opacity = op;
      o.material.depthWrite = op > 0.86;
      o.renderOrder = op > 0.86 ? 0 : 2;
      o.visible = !(u.heavy && !S.heavy);
      if (S.wire) {
        o.material.color.setHex(u.tn > .5 ? 0xDC1E6B : 0x2E5F8A);
        o.material.wireframe = u.grp === "FABRIC" ? false : (u.tri < 4000);
        o.material.metalness = .05; o.material.roughness = .95;
        if (o.material.emissive) o.material.emissive.setRGB(0, 0, 0);
      } else {
        o.material.wireframe = false;
        o.material.color.copy(u.baseColor).lerp(CHEM, u.tn * 0.62);
        if (hasFocus && !isF) o.material.color.lerp(COOL, 0.45);
        o.material.metalness = u.baseMetal * (1 - u.tn * .55);
        o.material.roughness = u.baseRough + u.tn * .12;
        if (o.material.emissive) o.material.emissive.setRGB(u.tn * .10, u.tn * .01, u.tn * .05);
      }
    }
  });
  if (!moving) S.matDirty = false;
}
function applyClip() {
  var pl = S.cut ? [clipPlane] : [];
  allMats.forEach(function (m) { m.clippingPlanes = pl; m.needsUpdate = true; });
}

/* ============================================================ DRAWER */
function buildDrawer() {
  var host = $("#plist"); host.innerHTML = "";
  var rows = {};
  Object.keys(META).forEach(function (key) {
    META[key].meshes.forEach(function (o) {
      var g = o.userData.grp;
      if (!rows[g]) rows[g] = {};
      var nm = o.name.replace(/-\d+$/, "");
      if (nm.indexOf("/") >= 0) nm = nm.split("/").pop().replace(/-\d+$/, "");
      if (!rows[g][nm]) rows[g][nm] = { n: 0, tri: 0, o: o, key: key };
      rows[g][nm].n++; rows[g][nm].tri += o.userData.tri;
    });
  });
  var total = 0;
  GROUPS.forEach(function (G) {
    var r = rows[G.k]; if (!r) return;
    var keys = Object.keys(r).sort(function (a, b) { return r[b].tri - r[a].tri; });
    var h = document.createElement("div"); h.className = "ghd";
    var gt = keys.reduce(function (a, kk) { return a + r[kk].tri; }, 0);
    var gn = keys.reduce(function (a, kk) { return a + r[kk].n; }, 0);
    total += gn;
    h.textContent = G.n + " · " + gn + " parts · " + (gt > 999 ? (gt / 1000).toFixed(0) + "k" : gt) + " tri";
    host.appendChild(h);
    keys.forEach(function (nm) {
      var e = r[nm];
      var d = document.createElement("div"); d.className = "pfam";
      d.dataset.q = (nm + " " + G.n).toLowerCase();
      d.innerHTML = '<button><span class="ct">×' + e.n + '</span><span class="nm"><b>' +
        esc(pretty(nm)) + '</b><span>' + esc(nm) + '</span></span><span class="tr">' +
        (e.tri > 999 ? (e.tri / 1000).toFixed(0) + "k" : e.tri) + '</span></button>';
      d.querySelector("button").onclick = function () { pick(e.o, e.key); closeDrawer(); };
      host.appendChild(d);
    });
  });
  $("#psearch").placeholder = "Search " + total + " parts…";
  $("#psearch").oninput = function () {
    var q = this.value.toLowerCase().trim();
    $$(".pfam", host).forEach(function (el) { el.style.display = !q || el.dataset.q.indexOf(q) >= 0 ? "" : "none"; });
    $$(".ghd", host).forEach(function (el) { el.style.display = q ? "none" : ""; });
  };
}
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]; }); }
function pretty(n) {
  var s = n.replace(/_/g, " ").replace(/\s+/g, " ").trim();
  s = s.replace(/^(Mirror)+/i, "").replace(/^duct(Tilting)?/i, "").trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function openDrawer() { $("#drawer").classList.add("on"); }
function closeDrawer() { $("#drawer").classList.remove("on"); }

/* ------------------------------------------------------------- isolate */
function pick(mesh, key) {
  S.iso = mesh.userData.grp;
  markDirty();
  var g = mesh.userData.grp, n = 0, tri = 0;
  META[key].meshes.forEach(function (o) { if (o.userData.grp === g) { n++; tri += o.userData.tri; } });
  $("#roGrp").textContent = GNAME[g] || g;
  $("#roName").textContent = pretty(mesh.name.replace(/-\d+$/, "").split("/").pop());
  $("#roEs").textContent = mesh.name;
  $("#roTri").textContent = fmt(mesh.userData.tri);
  var s = mesh.userData.size;
  $("#roDim").textContent = Math.round(s.x * 1000) + " × " + Math.round(s.y * 1000) + " × " + Math.round(s.z * 1000) + " mm";
  $("#roQty").textContent = "×" + n + " · " + fmt(tri) + " tri";
  var c = mesh.userData.mCtr;
  $("#roPos").textContent = c.x.toFixed(2) + ", " + c.y.toFixed(2) + ", " + c.z.toFixed(2);
  $("#readout").classList.add("on");
}
function clearIso() { S.iso = null; markDirty(); $("#readout").classList.remove("on"); }

/* ============================================================ CAMERA */
var anchors = [], cur = null, des = null;
function measure() {
  anchors = CH.map(function (c) {
    var el = document.getElementById(c.id); if (!el) return 0;
    return Math.max(0, el.offsetTop + el.offsetHeight / 2 - innerHeight / 2);
  });
}
function sph(t, az, el, d) {
  var a = az * Math.PI / 180, e = el * Math.PI / 180;
  return new THREE.Vector3(t.x + d * Math.cos(e) * Math.sin(a), t.y + d * Math.sin(e), t.z + d * Math.cos(e) * Math.cos(a));
}
function toScene(p, key) {
  var m = META[key]; if (!m) return new THREE.Vector3();
  return new THREE.Vector3(p[0], p[1], p[2]).sub(m.ctr).multiplyScalar(m.scale);
}
function computeDesired() {
  var y = pageYOffset, i = 0;
  while (i < anchors.length - 2 && y > anchors[i + 1]) i++;
  var a = anchors[i], b = anchors[i + 1];
  var t = b > a ? clamp((y - a) / (b - a), 0, 1) : 0;
  S.chIdx = i + t;
  var e = ease(t), A = CH[i], B = CH[i + 1] || CH[i];
  var tA = toScene(A.t, A.m), tB = toScene(B.t, B.m);
  des.tgt.copy(tA).lerp(tB, e);
  des.cam.copy(sph(tA, A.az, A.el, A.d)).lerp(sph(tB, B.az, B.el, B.d), e);
  des.exp = lerp(A.exp, B.exp, e);
  des.v = lerp(A.v, B.v, e);
  des.side = lerp(A.side === "l" ? 1 : -1, B.side === "l" ? 1 : -1, e);
  ["m", "d", "n"].forEach(function (k) {
    des.fade[k] = lerp(A.m === k ? 1 : 0, B.m === k ? 1 : 0, e);
  });
  /* focus follows whichever chapter dominates */
  var f = (t < .5 ? A : B).f;
  if ((S.focus && S.focus.join()) !== (f && f.join())) { S.focus = f; markDirty(); }
  var asp = innerWidth / innerHeight;
  var z = asp < .8 ? 1.72 : asp < 1.2 ? 1.28 : 1;
  if (z !== 1) des.cam.sub(des.tgt).multiplyScalar(z).add(des.tgt);
}

/* ============================================================ PINS */
var pinEls = [];
function buildPins() {
  var host = $("#pins"); host.innerHTML = ""; pinEls = [];
  CH.forEach(function (c, ci) {
    c.pins.forEach(function (p) {
      var el = document.createElement("div");
      el.className = "pin" + (p.f ? " f" : "");
      el.innerHTML = '<span class="lg"></span><span class="d"></span><span class="lb"><b>' + esc(p.t) +
        '</b><i>' + esc(p.e) + '</i>' + (p.u ? '<u>' + esc(p.u) + '</u>' : '') + '</span>';
      host.appendChild(el);
      pinEls.push({ el: el, ci: ci, p: p, key: c.m });
    });
  });
}

/* ============================================================ LOADING */
var loaded = { m: 0, d: 0, n: 0 }, totals = { m: 98130564, d: 33615796, n: 763972 };
function setProgress() {
  var p = clamp((loaded.m + loaded.d + loaded.n) / (totals.m + totals.d + totals.n), 0, 1);
  $("#lbar").style.width = (p * 100).toFixed(1) + "%";
  $("#lpct").textContent = (p * 100).toFixed(0) + "%";
}
function loadURL(url, key, label) {
  return new Promise(function (res, rej) {
    new THREE.GLTFLoader().load(url, res, function (ev) {
      if (ev.total) totals[key] = ev.total;
      loaded[key] = ev.loaded; setProgress();
      $("#lmsg").textContent = "STREAMING " + label;
    }, rej);
  });
}
function afterLoad() {
  if (META.m) $("#s1").textContent = fmt(META.m.meshes.length) + " parts · " + fmt(META.m.tris) + " tri";
  if (META.d) $("#s2").textContent = fmt(META.d.meshes.length) + " parts · " + fmt(META.d.tris) + " tri";
  if (META.n) $("#s3").textContent = fmt(META.n.meshes.length) + " part · " + fmt(META.n.tris) + " tri";
  buildDrawer(); buildPins();
  S.loaded = true;
  cur = { cam: camera.position.clone(), tgt: new THREE.Vector3(), exp: 0, v: 8, side: 1, fade: { m: 1, d: 0, n: 0 } };
  des = { cam: camera.position.clone(), tgt: new THREE.Vector3(), exp: 0, v: 8, side: 1, fade: { m: 1, d: 0, n: 0 } };
  measure(); computeDesired();
  cur.cam.copy(des.cam); cur.tgt.copy(des.tgt);
  markDirty();
  $("#lmsg").textContent = "READY";
  setTimeout(function () { $("#load").classList.add("gone"); $("#hud").classList.add("on"); }, 400);
}
function boot() {
  initThree();
  if (location.protocol === "file:") $("#lnote").textContent = "Opened from disk — trying anyway, a server may be needed.";
  loadURL("/models/Spray_assembly_Final_GLB.glb_0.glb", "m", "SPRAY ASSEMBLY")
    .then(function (g) {
      ingest(g.scene, "m", 7);
      return Promise.all([loadURL("/models/Spray_duct_subassembly.glb", "d", "SPRAY DUCT"),
                          loadURL("/models/Nozzle.glb", "n", "NOZZLE")]);
    })
    .then(function (r) {
      ingest(r[0].scene, "d", 10, META.m.scale);   // same scale => seamless hand-off
      ingest(r[1].scene, "n", 8);
      afterLoad();
    })
    .catch(function () {
      $("#lmsg").textContent = "BLOCKED";
      $("#fallback").classList.add("on");
      $("#lnote").textContent = "";
    });
}

/* drag & drop fallback */
(function () {
  var need = { m: null, d: null, n: null };
  var drop = $("#drop"), fin = $("#fin"), st = $("#dstate");
  function handle(files) {
    Array.prototype.forEach.call(files, function (f) {
      var n = f.name.toLowerCase();
      if (n.indexOf("nozzle") >= 0) need.n = f;
      else if (n.indexOf("duct") >= 0) need.d = f;
      else need.m = f;
    });
    st.textContent = (need.m ? "machine ✓ " : "machine … ") + (need.d ? "duct ✓ " : "duct … ") + (need.n ? "nozzle ✓" : "nozzle …");
    if (need.m && need.d && need.n) go();
  }
  function readAB(f, key) {
    return new Promise(function (res, rej) {
      var r = new FileReader();
      r.onprogress = function (e) { if (e.lengthComputable) { totals[key] = e.total; loaded[key] = e.loaded; setProgress(); } };
      r.onload = function () { loaded[key] = f.size; totals[key] = f.size; setProgress(); res(r.result); };
      r.onerror = rej; r.readAsArrayBuffer(f);
    });
  }
  function parse(buf) { return new Promise(function (res, rej) { new THREE.GLTFLoader().parse(buf, "", res, rej); }); }
  function go() {
    $("#fallback").classList.remove("on");
    $("#lmsg").textContent = "READING LOCAL FILES";
    loaded.m = loaded.d = loaded.n = 0;
    readAB(need.m, "m").then(parse)
      .then(function (g) { ingest(g.scene, "m", 10); return readAB(need.d, "d"); })
      .then(parse)
      .then(function (g) { ingest(g.scene, "d", 10, META.m.scale); return readAB(need.n, "n"); })
      .then(parse)
      .then(function (g) { ingest(g.scene, "n", 8); afterLoad(); })
      .catch(function (e) { st.textContent = "Could not read those — " + e.message; $("#fallback").classList.add("on"); });
  }
  drop.addEventListener("click", function () { fin.click(); });
  fin.addEventListener("change", function () { handle(this.files); });
  ["dragenter", "dragover"].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.add("over"); }); });
  ["dragleave", "drop"].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.remove("over"); }); });
  drop.addEventListener("drop", function (e) { handle(e.dataTransfer.files); });
  window.addEventListener("dragover", function (e) { e.preventDefault(); });
  window.addEventListener("drop", function (e) { e.preventDefault(); });
})();

/* ============================================================ INPUT */
var px = 0, py = 0, moved = 0;
function down(e) {
  S.dragging = true; moved = 0;
  px = e.touches ? e.touches[0].clientX : e.clientX;
  py = e.touches ? e.touches[0].clientY : e.clientY;
  canvas.classList.add("grab");
  var h = $("#hint"); if (h) h.style.opacity = 0;
}
function move(e) {
  if (!S.dragging) return;
  var x = e.touches ? e.touches[0].clientX : e.clientX;
  var y = e.touches ? e.touches[0].clientY : e.clientY;
  S.drag += (x - px) * 0.0055;
  S.tilt = clamp(S.tilt + (y - py) * 0.0034, -0.85, 0.85);
  moved += Math.abs(x - px) + Math.abs(y - py);
  px = x; py = y;
}
function up() { S.dragging = false; canvas.classList.remove("grab"); }
canvas.addEventListener("mousedown", down);
addEventListener("mousemove", move);
addEventListener("mouseup", up);
canvas.addEventListener("touchstart", down, { passive: true });
canvas.addEventListener("touchmove", move, { passive: true });
addEventListener("touchend", up);
canvas.addEventListener("wheel", function (e) {
  if (!e.ctrlKey && Math.abs(e.deltaY) > Math.abs(e.deltaX)) return;   // page scroll wins
  e.preventDefault(); S.dz = clamp(S.dz + e.deltaY * 0.01, -7, 14);
}, { passive: false });
canvas.addEventListener("click", function (e) {
  if (moved > 6 || !S.loaded) return;
  var r = canvas.getBoundingClientRect();
  var mo = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(mo, camera);
  var key = "m";
  ["m", "d", "n"].forEach(function (k) { if (META[k] && META[k].fade > 0.5) key = k; });
  var list = META[key] ? META[key].meshes.filter(function (o) { return o.visible; }) : [];
  var hit = raycaster.intersectObjects(list, false)[0];
  if (hit) pick(hit.object, key); else clearIso();
});
$("#roClose").onclick = clearIso;

function press(id, fn, init) {
  var b = $(id); if (!b) return;
  if (init !== undefined) b.setAttribute("aria-pressed", String(init));
  b.addEventListener("click", function () {
    var v = b.getAttribute("aria-pressed") !== "true";
    b.setAttribute("aria-pressed", String(v)); fn(v);
  });
}
press("#bGhost", function (v) { S.ghost = v; markDirty(); toast(v ? "Ghosting on — everything else drops to 17%" : "Ghosting off"); }, true);
press("#bExp", function (v) { S.exp = v; $("#expWrap").style.display = v ? "" : "none"; });
press("#bSpray", function (v) { S.spray = v; });
press("#bCut", function (v) { S.cut = v; $("#cutWrap").style.display = v ? "" : "none"; applyClip(); });
press("#bHeavy", function (v) { S.heavy = v; markDirty(); toast(v ? "Fasteners shown" : "M16 bolt patterns hidden · −170 730 tri"); }, true);
press("#bWire", function (v) { S.wire = v; markDirty(); });
$("#bReset").onclick = function () {
  S.drag = 0; S.tilt = 0; S.dz = 0; S.exp = false; S.cut = false; S.wire = false; S.spray = false; S.ghost = true;
  ["#bExp", "#bCut", "#bWire", "#bSpray"].forEach(function (i) { $(i).setAttribute("aria-pressed", "false"); });
  $("#bGhost").setAttribute("aria-pressed", "true");
  $("#expWrap").style.display = "none"; $("#cutWrap").style.display = "none";
  clearIso(); applyClip(); markDirty();
};
$("#expS").addEventListener("input", function () { S.expAmt = this.value / 100; $("#expV").textContent = this.value + "%"; });
$("#cutS").addEventListener("input", function () { S.cutPos = this.value / 100; });
$("#heroRun").onclick = function () {
  S.spray = true; $("#bSpray").setAttribute("aria-pressed", "true");
  toast("Spraying · scroll to run the fabric faster");
  window.scrollTo({ top: innerHeight * 0.96, behavior: "smooth" });
};
$("#drawerBtn").onclick = openDrawer;
$("#drawerClose").onclick = closeDrawer;
addEventListener("keydown", function (e) {
  if (/INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
  var k = e.key.toLowerCase();
  if (k === "g") $("#bGhost").click();
  else if (k === "e") $("#bExp").click();
  else if (k === "s") $("#bSpray").click();
  else if (k === "c") $("#bCut").click();
  else if (k === "r") $("#bReset").click();
  else if (k === "escape") { clearIso(); closeDrawer(); }
});
var tT;
function toast(m) {
  var t = $("#toast"); t.textContent = m; t.classList.add("on");
  clearTimeout(tT); tT = setTimeout(function () { t.classList.remove("on"); }, 2400);
}

/* ============================================================ FRAME */
var last = performance.now(), running = true;
var wp = new THREE.Vector3(), dirv = new THREE.Vector3(), axv = new THREE.Vector3();
function resize() {
  var w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
  sizeStrip(); measure(); sizeCharts();
}
addEventListener("resize", resize);
addEventListener("orientationchange", function () { setTimeout(resize, 250); });
document.addEventListener("visibilitychange", function () { running = !document.hidden; last = performance.now(); });

function frame(now) {
  requestAnimationFrame(frame);
  if (!running) return;
  var dt = Math.min((now - last) / 1000, .05); last = now;
  var y = pageYOffset, mx = document.body.scrollHeight - innerHeight;
  $("#nav").classList.toggle("stuck", y > 40);
  $("#prog").style.width = (mx > 0 ? y / mx * 100 : 0) + "%";
  if (!S.loaded) return;

  var k = RED ? 1 : 1 - Math.exp(-dt * 5.2);
  computeDesired();
  cur.cam.lerp(des.cam, k); cur.tgt.lerp(des.tgt, k);
  cur.exp = lerp(cur.exp, des.exp, k);
  cur.v = lerp(cur.v, des.v, k);
  cur.side = lerp(cur.side, des.side, k);
  ["m", "d", "n"].forEach(function (key) {
    var f = lerp(cur.fade[key], des.fade[key], k);
    if (Math.abs(f - cur.fade[key]) > 0.0015) markDirty();
    cur.fade[key] = f;
    if (META[key]) META[key].fade = f;
  });
  S.speed = cur.v;

  var off = cur.cam.clone().sub(cur.tgt);
  var rad = Math.max(1.5, off.length() + S.dz);
  var azi = Math.atan2(off.x, off.z) + S.drag;
  var elv = clamp(Math.asin(clamp(off.y / off.length(), -1, 1)) + S.tilt, -1.35, 1.35);
  camera.position.set(cur.tgt.x + rad * Math.cos(elv) * Math.sin(azi),
                      cur.tgt.y + rad * Math.sin(elv),
                      cur.tgt.z + rad * Math.cos(elv) * Math.cos(azi));
  camera.lookAt(cur.tgt);
  if (innerWidth > 980) camera.translateX(-cur.side * rad * 0.12);

  /* explode — chapters drive it automatically, the HUD toggle overrides */
  var amt = Math.max(cur.exp, S.exp ? S.expAmt : 0);
  Object.keys(META).forEach(function (key) {
    var m = META[key]; if (!MODEL[key].visible) return;
    for (var i = 0; i < m.meshes.length; i++) {
      var o = m.meshes[i];
      o.position.copy(o.userData.base).addScaledVector(o.userData.expV, amt);
    }
  });

  if (S.cut) {
    var mm = META.d && META.d.fade > .5 ? META.d : META.m;
    var half = mm ? mm.size.z * mm.scale * .62 : 8;
    clipPlane.constant = lerp(-half, half, S.cutPos);
  }

  updateMaterials(k);
  ["m", "d"].forEach(function (key) { updateSpray(key, dt, S.spray && META[key] && META[key].fade > .3 && amt < .1); });

  window.__sh.position.y = -6.0 - amt * 2;
  window.__sh.material.opacity = .28 * (1 - amt * .5);

  updatePins();
  updateReadouts();
  renderer.render(scene, camera);
}
function updatePins() {
  var W = canvas.clientWidth, H = canvas.clientHeight;
  for (var i = 0; i < pinEls.length; i++) {
    var P = pinEls[i];
    var wgt = clamp(1 - Math.abs(S.chIdx - P.ci) * 1.8, 0, 1);
    var m = META[P.key];
    if (wgt <= .02 || cur.exp > .3 || W < 720 || S.iso || !m || m.fade < .55) { P.el.style.opacity = 0; continue; }
    wp.copy(toScene(P.p.p, P.key));
    dirv.copy(wp).normalize();
    axv.copy(camera.position).sub(wp).normalize();
    var facing = clamp((dirv.dot(axv) + .3) / .8, 0, 1);
    wp.project(camera);
    if (wp.z > 1) { P.el.style.opacity = 0; continue; }
    P.el.style.transform = "translate(" + ((wp.x * .5 + .5) * W).toFixed(1) + "px," + ((-wp.y * .5 + .5) * H).toFixed(1) + "px)";
    P.el.style.opacity = (wgt * (.4 + .6 * facing)).toFixed(3);
  }
}
var lastRO = 0;
function updateReadouts() {
  var t = performance.now();
  if (t - lastRO < 70) return;
  lastRO = t;
  var spd = S.speed, add = D.add, pr = D.pr, n = D.noz, w = D.w / 1000;
  var duty = clamp(dutyAt(spd, add, pr, n, w), 0, 1);
  var flow = requiredFlow(add, w, spd);
  $("#vSpd").innerHTML = fmt(spd) + "<u>m/min</u>";
  $("#vDuty").innerHTML = fmt(duty * 100) + "<u>%</u>";
  $("#vFlow").innerHTML = flow.toFixed(1) + "<u>L/min</u>";
  $("#vGsm").innerHTML = fmt(add) + "<u>g/m²</u>";
  drawStrip(spd);
  if (stripProf) $("#vCv").textContent = stripProf.cv.toFixed(1) + "%";
  var set = function (id, v) { var e = $(id); if (e) e.textContent = v; };
  set("#dutyNow", fmt(duty * 100) + " %");
  set("#linePr", pr.toFixed(1) + " bar");
  set("#vmd", Math.round(vmd(pr)) + " µm VMD");
  set("#tankLvl", fmt(420 - (spd / 80) * 90) + " L");
}

/* ============================================================ CHARTS */
function mk(id, h) { var cv = $(id); return { cv: cv, ctx: cv.getContext("2d"), h: h, w: 0, hh: 0 }; }
var C1 = mk("#cvDose", .48), C2 = mk("#cvUni", .46), C3 = mk("#cvSave", .44);
function sizeOne(C) {
  var r = C.cv.parentNode.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
  C.w = r.width; C.hh = Math.max(230, Math.min(500, r.width * C.h));
  C.cv.style.height = C.hh + "px";
  C.cv.width = C.w * dpr; C.cv.height = C.hh * dpr;
  C.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
function sizeCharts() { [C1, C2, C3].forEach(sizeOne); drawDose(); drawUni(); drawSave(); }
function axes(C, pad, xt, yt, xl, yl, xlab, ylab, ycol) {
  var c = C.ctx, w = C.w, h = C.hh;
  c.clearRect(0, 0, w, h);
  c.strokeStyle = "rgba(15,21,29,.075)"; c.lineWidth = 1;
  c.font = "10px 'IBM Plex Mono',monospace";
  xt.forEach(function (t) {
    var X = pad.l + (t.v - xl[0]) / (xl[1] - xl[0]) * (w - pad.l - pad.r);
    c.beginPath(); c.moveTo(X, pad.t); c.lineTo(X, h - pad.b); c.stroke();
    c.fillStyle = "#7A8794"; c.textAlign = "center"; c.fillText(t.l, X, h - pad.b + 15);
  });
  yt.forEach(function (t) {
    var Y = h - pad.b - (t.v - yl[0]) / (yl[1] - yl[0]) * (h - pad.t - pad.b);
    c.beginPath(); c.moveTo(pad.l, Y); c.lineTo(w - pad.r, Y); c.stroke();
    c.fillStyle = "#7A8794"; c.textAlign = "right"; c.fillText(t.l, pad.l - 8, Y + 3);
  });
  c.strokeStyle = "rgba(15,21,29,.22)";
  c.beginPath(); c.moveTo(pad.l, pad.t); c.lineTo(pad.l, h - pad.b); c.lineTo(w - pad.r, h - pad.b); c.stroke();
  if (xlab) { c.fillStyle = "#7A8794"; c.textAlign = "center"; c.fillText(xlab, w / 2, h - 5); }
  if (ylab) { c.save(); c.translate(13, h / 2); c.rotate(-Math.PI / 2); c.textAlign = "center"; c.fillStyle = ycol || "#7A8794"; c.fillText(ylab, 0, 0); c.restore(); }
}

/* -------- chart 1: duty vs line speed -------- */
var D = { add: 30, pr: 2.5, noz: 24, w: 2000, pwm: true, cursor: 40 };
function drawDose() {
  var C = C1; if (!C.w) return;
  var c = C.ctx, w = C.w, h = C.hh, pad = { l: 52, r: 54, t: 18, b: 30 };
  var X = function (v) { return pad.l + v / 90 * (w - pad.l - pad.r); };
  var Y = function (v) { return h - pad.b - v / 120 * (h - pad.t - pad.b); };
  var xt = [], yt = [];
  for (var s = 0; s <= 90; s += 15) xt.push({ v: s, l: s });
  for (var d = 0; d <= 120; d += 20) yt.push({ v: d, l: d });
  axes(C, pad, xt, yt, [0, 90], [0, 120], "LINE SPEED m/min", "DUTY CYCLE %", "#DC1E6B");

  /* over-100% region */
  c.fillStyle = "rgba(255,82,82,.07)"; c.fillRect(pad.l, pad.t, w - pad.l - pad.r, Y(100) - pad.t);
  c.strokeStyle = "rgba(255,82,82,.45)"; c.setLineDash([4, 4]); c.lineWidth = 1;
  c.beginPath(); c.moveTo(pad.l, Y(100)); c.lineTo(w - pad.r, Y(100)); c.stroke(); c.setLineDash([]);
  c.fillStyle = "rgba(255,82,82,.75)"; c.font = "9px 'IBM Plex Mono',monospace"; c.textAlign = "left";
  c.fillText("CANNOT HOLD SET POINT", pad.l + 8, Y(100) - 7);

  /* duty curves for a few pressures, faint */
  [1.5, 3.5, 4.5].forEach(function (p) {
    c.beginPath();
    for (var s2 = 2; s2 <= 90; s2 += 1) c.lineTo(X(s2), Y(clamp(dutyAt(s2, D.add, p, D.noz, D.w / 1000) * 100, 0, 122)));
    c.strokeStyle = "rgba(15,21,29,.14)"; c.lineWidth = 1; c.stroke();
    c.fillStyle = "rgba(15,21,29,.36)"; c.textAlign = "left";
    var yy = Y(clamp(dutyAt(88, D.add, p, D.noz, D.w / 1000) * 100, 0, 118));
    c.fillText(p.toFixed(1) + " bar", w - pad.r + 6, yy + 3);
  });
  /* flow, right axis */
  c.beginPath();
  for (var s3 = 2; s3 <= 90; s3 += 1) c.lineTo(X(s3), h - pad.b - requiredFlow(D.add, D.w / 1000, s3) / 14 * (h - pad.t - pad.b));
  c.strokeStyle = "rgba(12,140,160,.65)"; c.lineWidth = 1.4; c.setLineDash([3, 3]); c.stroke(); c.setLineDash([]);
  c.fillStyle = "rgba(12,140,160,.85)"; c.textAlign = "right"; c.fillText("flow L/min", w - pad.r - 4, pad.t + 12);

  /* main curve */
  c.beginPath();
  for (var s4 = 2; s4 <= 90; s4 += 1) {
    var dv = clamp(dutyAt(s4, D.add, D.pr, D.noz, D.w / 1000) * 100, 0, 122);
    c.lineTo(X(s4), Y(dv));
  }
  c.strokeStyle = "#DC1E6B"; c.lineWidth = 2.4; c.lineJoin = "round"; c.stroke();

  /* cursor */
  var cn = clamp(D.cursor, 2, 90), cx = X(cn);
  var dv2 = dutyAt(cn, D.add, D.pr, D.noz, D.w / 1000) * 100;
  c.beginPath(); c.moveTo(cx, pad.t); c.lineTo(cx, h - pad.b);
  c.strokeStyle = "rgba(15,21,29,.30)"; c.lineWidth = 1; c.stroke();
  c.beginPath(); c.arc(cx, Y(clamp(dv2, 0, 122)), 4.5, 0, 7); c.fillStyle = "#DC1E6B"; c.fill();

  /* PWM trace inset */
  if (D.pwm) {
    var bw = 118, bh = 34, bx = pad.l + 12, by = pad.t + 10;
    c.fillStyle = "rgba(15,21,29,.95)"; c.fillRect(bx, by, bw, bh);
    c.strokeStyle = "rgba(150,180,215,.2)"; c.lineWidth = 1; c.strokeRect(bx, by, bw, bh);
    var duty = clamp(dv2 / 100, 0, 1), cyc = 4, cw = bw / cyc;
    c.beginPath();
    for (var i = 0; i < cyc; i++) {
      var x0 = bx + i * cw, xh = x0 + cw * duty;
      c.moveTo(x0, by + bh - 4); c.lineTo(x0, by + 5); c.lineTo(xh, by + 5); c.lineTo(xh, by + bh - 4); c.lineTo(x0 + cw, by + bh - 4);
    }
    c.strokeStyle = "#5FE3F5"; c.lineWidth = 1.6; c.stroke();
    c.fillStyle = "rgba(95,227,245,.9)"; c.font = "8px 'IBM Plex Mono',monospace"; c.textAlign = "left";
    c.fillText("NOZZLE PWM " + dv2.toFixed(0) + "%", bx + 3, by - 3);
  }

  var mS = maxSpeed(D.add, D.pr, D.noz, D.w / 1000);
  var fl = requiredFlow(D.add, D.w / 1000, cn);
  $("#rvSpd").innerHTML = fmt(cn) + "<u>m/min</u>";
  $("#rvDuty").innerHTML = dv2.toFixed(0) + "<u>%</u>";
  $("#rvDuty").style.color = dv2 > 100 ? "#CF2E28" : "";
  $("#rvFlow").innerHTML = fl.toFixed(2) + "<u>L/min</u>";
  $("#rvPerNoz").innerHTML = (fl / D.noz).toFixed(3) + "<u>L/min</u>";
  $("#rvMax").innerHTML = fmt(Math.min(mS, 999)) + "<u>m/min</u>";
  $("#rvVmd").innerHTML = Math.round(vmd(D.pr)) + "<u>µm</u>";
}

/* -------- chart 2: coverage uniformity -------- */
var U = { ang: 65, stand: 245, pitch: 181.8, stagger: 0, fans: true, asbuilt: true };
function drawUni() {
  var C = C2; if (!C.w) return;
  var c = C.ctx, w = C.w, h = C.hh, pad = { l: 52, r: 22, t: 20, b: 30 };
  var P = profile({ pitch: U.pitch, stand: U.stand, ang: U.ang, stagger: U.stagger / 100 });
  var half = GEO.webWidth * 1000 / 2 * 1.18;
  var X = function (x) { return pad.l + (x + half) / (2 * half) * (w - pad.l - pad.r); };
  var top = Math.max(P.max * 1.25, 1);
  var Y = function (v) { return h - pad.b - v / top * (h - pad.t - pad.b); };
  var xt = [], yt = [];
  for (var x0 = -1000; x0 <= 1000; x0 += 500) xt.push({ v: x0, l: x0 });
  for (var i = 0; i <= 4; i++) yt.push({ v: top * i / 4, l: (top * i / 4).toFixed(1) });
  axes(C, pad, xt, yt, [-half, half], [0, top], "POSITION ACROSS WEB mm", "RELATIVE DEPOSITION", "#DC1E6B");

  var e0 = X(-1000), e1 = X(1000);
  c.fillStyle = "rgba(12,140,160,.07)"; c.fillRect(e0, pad.t, e1 - e0, h - pad.t - pad.b);
  c.strokeStyle = "rgba(12,140,160,.45)"; c.lineWidth = 1;
  [e0, e1].forEach(function (x) { c.beginPath(); c.moveTo(x, pad.t); c.lineTo(x, h - pad.b); c.stroke(); });
  c.fillStyle = "rgba(12,140,160,.8)"; c.font = "9px 'IBM Plex Mono',monospace"; c.textAlign = "center";
  c.fillText("SELVEDGE", e0, pad.t - 6); c.fillText("SELVEDGE", e1, pad.t - 6);

  if (U.fans) {
    P.zs.forEach(function (nz) {
      if (nz.b) return;
      c.beginPath();
      for (var i2 = 0; i2 < P.xs.length; i2 += 2) c.lineTo(X(P.xs[i2]), Y(P.fan(P.xs[i2], nz.z)));
      c.strokeStyle = "rgba(220,30,107,.26)"; c.lineWidth = 1; c.stroke();
    });
  }
  /* both faces together — only interesting once the banks are staggered */
  if (U.stagger > 0) {
    c.beginPath();
    for (var i5 = 0; i5 < P.xs.length; i5++) c.lineTo(X(P.xs[i5]), Y(P.yt[i5] / 2));
    c.strokeStyle = "#0C8CA0"; c.lineWidth = 1.6; c.setLineDash([5, 3]); c.stroke(); c.setLineDash([]);
    c.fillStyle = "#0C8CA0"; c.textAlign = "right"; c.font = "9px 'IBM Plex Mono',monospace";
    c.fillText("both faces ÷2 · CV " + P.totCv.toFixed(1) + "%", w - pad.r - 6, pad.t + 12);
  }
  c.beginPath(); c.moveTo(X(P.xs[0]), Y(0));
  for (var i3 = 0; i3 < P.xs.length; i3++) c.lineTo(X(P.xs[i3]), Y(P.ys[i3]));
  c.lineTo(X(P.xs[P.xs.length - 1]), Y(0)); c.closePath();
  var g = c.createLinearGradient(0, pad.t, 0, h - pad.b);
  g.addColorStop(0, "rgba(220,30,107,.24)"); g.addColorStop(1, "rgba(220,30,107,.02)");
  c.fillStyle = g; c.fill();
  c.beginPath();
  for (var i4 = 0; i4 < P.xs.length; i4++) {
    var xx = X(P.xs[i4]), yy = Y(P.ys[i4]);
    if (i4 === 0) c.moveTo(xx, yy); else c.lineTo(xx, yy);
  }
  c.strokeStyle = "#DC1E6B"; c.lineWidth = 2.4; c.stroke();

  c.beginPath(); c.moveTo(e0, Y(P.mean)); c.lineTo(e1, Y(P.mean));
  c.strokeStyle = "rgba(15,21,29,.32)"; c.setLineDash([4, 4]); c.lineWidth = 1; c.stroke(); c.setLineDash([]);
  c.fillStyle = "rgba(15,21,29,.5)"; c.textAlign = "left"; c.fillText("mean", e0 + 5, Y(P.mean) - 5);

  c.fillStyle = "rgba(12,140,160,.8)";
  P.zs.forEach(function (nz) { if (!nz.b) c.fillRect(X(nz.z) - 1, h - pad.b - 5, 2, 5); });

  var verd = P.cv < 3 ? "Excellent" : P.cv < 6 ? "Good" : P.cv < 12 ? "Visible banding" : "Striped";
  $("#rvCv").style.color = P.cv < 6 ? "" : P.cv < 12 ? "#B87708" : "#CF2E28";
  $("#rvPv").innerHTML = P.pv.toFixed(1) + "<u>%</u>";
  $("#rvOv").innerHTML = P.overlap.toFixed(2) + "<u>×</u>";
  $("#rvFan").innerHTML = fmt(P.w * 2) + "<u>mm</u>";
  $("#rvEdge").innerHTML = P.edge.toFixed(1) + "<u>%</u>";
  $("#rvCv").innerHTML = P.cv.toFixed(1) + "<u>% face</u>";
  $("#rvVerd").innerHTML = verd;
  $("#rvVerd").style.color = P.cv < 6 ? "#0C8CA0" : P.cv < 12 ? "#B87708" : "#CF2E28";
  stripProf = null;
}

/* -------- chart 3: savings -------- */
var G = { gsm: 180, spd: 40, pad: 65, spr: 25, mode: "hr" };
function drawSave() {
  var C = C3; if (!C.w) return;
  var c = C.ctx, w = C.w, h = C.hh, pad = { l: 58, r: 22, t: 24, b: 46 };
  var r = savings(G);
  var yr = G.mode === "yr";
  var padE = (r.padLh * .96) * 2.60 / 0.60 / 3.6;   // kW to dry pad liquor
  var sprE = (r.sprLh * .96) * 2.60 / 0.60 / 3.6;
  var rows = [
    { l: "Liquor on cloth", a: r.padLh, b: r.sprLh, u: "L/h" },
    { l: "Drying load", a: padE, b: sprE, u: "kW" },
    { l: "Gas burnt", a: padE * 3.6 / 35.8, b: sprE * 3.6 / 35.8, u: "m³/h" }
  ];
  if (yr) rows.forEach(function (o) { o.a *= 5760 / 1000; o.b *= 5760 / 1000; o.u = o.u === "L/h" ? "kL/yr" : (o.u === "kW" ? "MWh/yr" : "k m³/yr"); });

  c.clearRect(0, 0, w, h);
  var bh = (h - pad.t - pad.b) / rows.length;
  var maxv = Math.max.apply(null, rows.map(function (o) { return o.a; })) * 1.16;
  c.font = "10px 'IBM Plex Mono',monospace";
  rows.forEach(function (o, i) {
    var y0 = pad.t + i * bh, bar = Math.min(bh * .30, 24);
    c.fillStyle = "#7A8794"; c.textAlign = "right";
    c.fillText(o.l, pad.l - 10, y0 + bar + 4);
    var W2 = w - pad.l - pad.r;
    c.fillStyle = "rgba(15,21,29,.035)"; c.fillRect(pad.l, y0, W2, bar * 2 + 8);
    /* pad bar */
    c.fillStyle = "rgba(15,21,29,.24)";
    c.fillRect(pad.l, y0 + 2, W2 * o.a / maxv, bar);
    /* spray bar */
    var gg = c.createLinearGradient(pad.l, 0, pad.l + W2 * o.b / maxv, 0);
    gg.addColorStop(0, "#A80E4F"); gg.addColorStop(1, "#DC1E6B");
    c.fillStyle = gg; c.fillRect(pad.l, y0 + bar + 6, W2 * o.b / maxv, bar);
    c.textAlign = "left"; c.fillStyle = "rgba(15,21,29,.62)";
    c.fillText("pad " + fmt(o.a, o.a < 20 ? 1 : 0) + " " + o.u, pad.l + W2 * o.a / maxv + 8, y0 + bar - 1);
    c.fillStyle = "#DC1E6B";
    c.fillText("spray " + fmt(o.b, o.b < 20 ? 1 : 0) + " " + o.u, pad.l + W2 * o.b / maxv + 8, y0 + bar * 2 + 5);
  });
  c.textAlign = "center"; c.fillStyle = "#7A8794";
  c.fillText(yr ? "PER YEAR · 16 h/day · 360 days" : "PER HOUR AT " + G.spd + " m/min", w / 2, h - 8);

  $("#rvWater").innerHTML = fmt(r.water) + "<u>kg/h</u>";
  $("#rvChem").innerHTML = fmt(r.padLh - r.sprLh) + "<u>L/h</u>";
  $("#rvEn").innerHTML = fmt(r.kW) + "<u>kW</u>";
  $("#rvGas").innerHTML = fmt(r.gas, 1) + "<u>m³/h</u>";
  $("#rvCo2").innerHTML = fmt(r.co2) + "<u>kg/h</u>";
  $("#rvPct").innerHTML = r.pct.toFixed(0) + "<u>%</u>";
}

/* ------------------------------------------------------------- wiring */
function seg(id, fn) {
  var g = $(id); if (!g) return;
  $$("button", g).forEach(function (b) {
    b.onclick = function () {
      $$("button", g).forEach(function (o) { o.setAttribute("aria-pressed", "false"); });
      b.setAttribute("aria-pressed", "true"); fn(b.dataset.v);
    };
  });
}
seg("#segPwm", function (v) { D.pwm = v === "on"; drawDose(); });
seg("#segFans", function (v) { U.fans = v === "on"; drawUni(); });
seg("#segAs", function (v) {
  U.asbuilt = v === "on";
  if (U.asbuilt) {
    U.ang = 65; U.stand = 245; U.pitch = 181.8; U.stagger = 0;
    $("#uAng").value = 65; $("#uStand").value = 245; $("#uPitch").value = 182; $("#uStag").value = 0;
    $("#uAngV").textContent = "65°"; $("#uStandV").textContent = "245 mm";
    $("#uPitchV").textContent = "181.8 mm"; $("#uStagV").textContent = "0%";
  }
  drawUni();
});
seg("#segCost", function (v) { G.mode = v; drawSave(); });
function bind(id, out, fn, f) {
  var el = $(id); if (!el) return;
  var run = function () { var v = +el.value; $(out).textContent = f(v); fn(v); };
  el.addEventListener("input", run); run();
}
bind("#dAdd", "#dAddV", function (v) { D.add = v; drawDose(); }, function (v) { return v + " g/m²"; });
bind("#dPr", "#dPrV", function (v) { D.pr = v / 10; drawDose(); }, function (v) { return (v / 10).toFixed(1) + " bar"; });
bind("#dNoz", "#dNozV", function (v) { D.noz = v; drawDose(); }, function (v) { return "" + v; });
bind("#dW", "#dWV", function (v) { D.w = v; drawDose(); }, function (v) { return fmt(v) + " mm"; });
bind("#uAng", "#uAngV", function (v) { U.ang = v; drawUni(); }, function (v) { return v + "°"; });
bind("#uStand", "#uStandV", function (v) { U.stand = v; drawUni(); }, function (v) { return v + " mm"; });
bind("#uPitch", "#uPitchV", function (v) { U.pitch = (v === 182 ? 181.8 : v); drawUni(); }, function (v) { return (v === 182 ? "181.8" : v) + " mm"; });
bind("#uStag", "#uStagV", function (v) { U.stagger = v; drawUni(); }, function (v) { return v + "%"; });
bind("#gGsm", "#gGsmV", function (v) { G.gsm = v; drawSave(); }, function (v) { return v + " g/m²"; });
bind("#gSpd", "#gSpdV", function (v) { G.spd = v; drawSave(); }, function (v) { return v + " m/min"; });
bind("#gPad", "#gPadV", function (v) { G.pad = v; drawSave(); }, function (v) { return v + "%"; });
bind("#gSpr", "#gSprV", function (v) { G.spr = v; drawSave(); }, function (v) { return v + "%"; });

(function () {
  var dr = false;
  function scrub(e) {
    var r = C1.cv.getBoundingClientRect();
    var x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
    D.cursor = clamp((x - 52) / (r.width - 106), 0, 1) * 90; drawDose();
  }
  C1.cv.addEventListener("mousedown", function (e) { dr = true; scrub(e); });
  C1.cv.addEventListener("mousemove", function (e) { if (dr) scrub(e); });
  addEventListener("mouseup", function () { dr = false; });
  C1.cv.addEventListener("touchmove", function (e) { scrub(e); }, { passive: true });
})();

var io = new IntersectionObserver(function (es) {
  es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
}, { threshold: .14, rootMargin: "0px 0px -6% 0px" });
$$(".rv, .card").forEach(function (el) { io.observe(el); });


/* ============================================================ HOW IT SPRAYS
   PWM oscilloscope — carried over from spray6, re-drawn for a light panel. */
(function () {
  var cv = $("#scope"); if (!cv) return;
  var cx = cv.getContext("2d");
  var freqS = $("#freqSlider"), dutyS = $("#dutySlider");
  var freq = 50, duty = 10, cover = 0, parts = [], flashUntil = 0;
  var W = 0, H = 230, waveH, bayTop, fabricY;
  var dpr = Math.min(devicePixelRatio || 1, 2);

  function size() {
    W = cv.clientWidth || 600;
    cv.width = W * dpr; cv.height = H * dpr;
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function readouts() {
    var period = 1000 / freq;
    $("#freqOut").textContent = freq + " Hz";
    $("#dutyOut").textContent = duty + "%";
    $("#rCycle").textContent = period.toFixed(1) + " ms";
    $("#rOn").textContent = (period * duty / 100).toFixed(1) + " ms";
    $("#rPulses").textContent = freq;
  }
  freqS.addEventListener("input", function () { freq = +freqS.value; readouts(); });
  dutyS.addEventListener("input", function () { duty = +dutyS.value; readouts(); });
  $("#resetScope").addEventListener("click", function () {
    freq = 50; duty = 10; freqS.value = 50; dutyS.value = 10; readouts();
  });
  addEventListener("resize", size);

  function draw(now) {
    requestAnimationFrame(draw);
    if (!W) size();
    if (document.hidden) return;
    var r = cv.getBoundingClientRect();
    if (r.bottom < -200 || r.top > innerHeight + 200) return;   // offscreen: idle

    waveH = H * 0.52; bayTop = waveH + 14; fabricY = H - 16;
    cx.clearRect(0, 0, W, H);

    cx.strokeStyle = "rgba(15,21,29,.07)"; cx.lineWidth = 1;
    for (var gx = 0; gx < W; gx += W / 10) { cx.beginPath(); cx.moveTo(gx, 0); cx.lineTo(gx, waveH); cx.stroke(); }
    cx.beginPath(); cx.moveTo(0, waveH * .5); cx.lineTo(W, waveH * .5);
    cx.strokeStyle = "rgba(15,21,29,.05)"; cx.stroke();

    var period = 1000 / freq, cycles = 4, cellW = W / cycles;
    var t = RED ? 0 : now;
    var yHigh = waveH * 0.18, yLow = waveH * 0.82, df = duty / 100;
    var shift = RED ? 0 : (t % period) / period;

    cx.beginPath(); cx.strokeStyle = "#DC1E6B"; cx.lineWidth = 2.4;
    var x = -shift * cellW, first = true;
    while (x < W + cellW) {
      var onEnd = x + cellW * df;
      if (first) { cx.moveTo(Math.max(x, 0), yHigh); first = false; } else { cx.lineTo(x, yHigh); }
      cx.lineTo(onEnd, yHigh); cx.lineTo(onEnd, yLow); cx.lineTo(x + cellW, yLow);
      x += cellW;
    }
    cx.stroke();

    var ripple = Math.max(2, 14 - freq * 0.14);
    var effY = yLow - (yLow - yHigh) * df;
    cx.beginPath(); cx.strokeStyle = "#0C8CA0"; cx.lineWidth = 2;
    for (var px = 0; px <= W; px += 4) {
      var ry = effY + Math.sin((px * 0.06) + now * 0.006) * ripple * 0.3;
      if (px === 0) cx.moveTo(px, ry); else cx.lineTo(px, ry);
    }
    cx.stroke();

    var phase = (t % period) / period;
    if (phase < df) flashUntil = now + 40;
    var on = now < flashUntil;
    var st = $("#rState");
    st.textContent = on ? "ON" : "OFF";
    st.style.color = on ? "#0C8CA0" : "#A6B2BF";

    cx.strokeStyle = "rgba(15,21,29,.12)";
    cx.beginPath(); cx.moveTo(0, fabricY); cx.lineTo(W, fabricY); cx.stroke();
    cx.fillStyle = "rgba(15,21,29,.40)"; cx.font = "10px 'IBM Plex Mono',monospace";
    cx.fillText("FABRIC", 6, fabricY + 13);

    if (on && !RED) {
      var n = Math.max(1, Math.round(duty / 10));
      for (var i = 0; i < n; i++) parts.push({ x: Math.random() * W, y: bayTop, vy: 1.4 + Math.random() * 1.2, life: 1 });
      cover = Math.min(100, cover + duty * 0.03);
    } else cover = Math.max(0, cover - 0.15);
    $("#coverageFill").style.width = cover + "%";

    cx.fillStyle = "#DC1E6B";
    parts.forEach(function (p) {
      p.y += p.vy; p.life -= 0.02;
      cx.globalAlpha = Math.max(0, p.life) * .85;
      cx.beginPath(); cx.arc(p.x, p.y, 1.8, 0, 6.2832); cx.fill();
    });
    cx.globalAlpha = 1;
    parts = parts.filter(function (p) { return p.life > 0 && p.y < fabricY + 4; });
  }
  size(); readouts(); requestAnimationFrame(draw);
})();

/* ============================================================ NOZZLE ARRAY
   Synchronized spray mode:
   - ON + Both faces  => all 24 nozzles spray continuously at the same time
   - ON + One face    => all 12 Bank A nozzles spray continuously at the same time
   - OFF              => no nozzles spray
   The fabric remains in motion through the centre in every mode.
   Geometry still uses the measured 181.8 mm pitch and 12 nozzles per bank. */
(function () {
  var svg = $("#nozzleSvg"), tip = $("#arrayTip");
  if (!svg) return;

  var NS = "http://www.w3.org/2000/svg";
  var PITCH = GEO.pitch * 1000;
  var N = GEO.nozzlesPerBank;

  var state = {
    power: "on",
    mode: "dual"
  };

  function el(tag, at) {
    var e = document.createElementNS(NS, tag);
    for (var k in at) e.setAttribute(k, at[k]);
    return e;
  }

  function addFabricPattern(defs) {
    var pattern = el("pattern", {
      id: "arrayFabricPattern",
      width: 24,
      height: 16,
      patternUnits: "userSpaceOnUse"
    });

    pattern.appendChild(el("rect", {
      x: 0, y: 0, width: 24, height: 16,
      fill: "rgba(12,140,160,.085)"
    }));

    pattern.appendChild(el("line", {
      x1: 0, y1: 4, x2: 24, y2: 4,
      stroke: "rgba(12,140,160,.17)",
      "stroke-width": 1
    }));

    pattern.appendChild(el("line", {
      x1: 0, y1: 12, x2: 24, y2: 12,
      stroke: "rgba(12,140,160,.11)",
      "stroke-width": 1
    }));

    pattern.appendChild(el("line", {
      x1: 6, y1: 0, x2: 6, y2: 16,
      stroke: "rgba(255,255,255,.48)",
      "stroke-width": 1
    }));

    pattern.appendChild(el("line", {
      x1: 18, y1: 0, x2: 18, y2: 16,
      stroke: "rgba(255,255,255,.30)",
      "stroke-width": 1
    }));

    if (!RED) {
      var anim = el("animateTransform", {
        attributeName: "patternTransform",
        type: "translate",
        from: "0 0",
        to: "0 -16",
        dur: "0.85s",
        repeatCount: "indefinite"
      });
      pattern.appendChild(anim);
    }

    defs.appendChild(pattern);
  }

  function addDroplets(ng, cx, side) {
    var ys = side === "top" ? [72, 79, 86] : [248, 241, 234];
    var xs = [cx - 4, cx + 3, cx - 1];

    for (var d = 0; d < 3; d++) {
      ng.appendChild(el("circle", {
        class: "droplet d" + (d + 1),
        cx: xs[d],
        cy: ys[d],
        r: d === 1 ? 2.0 : 1.6
      }));
    }
  }

  function build() {
    svg.innerHTML = "";

    var margin = 80;
    var W = 1000;
    var usable = W - margin * 2;
    var step = usable / (N - 1);
    var webTop = 132;
    var webBot = 188;

    var defs = el("defs", {});
    addFabricPattern(defs);
    svg.appendChild(defs);

    /* moving centre fabric */
    svg.appendChild(el("rect", {
      x: 0,
      y: webTop,
      width: 1000,
      height: webBot - webTop,
      class: "fabric-band"
    }));

    /* extra motion traces make the web direction easy to read */
    for (var fl = 0; fl < 4; fl++) {
      svg.appendChild(el("line", {
        x1: 0,
        y1: webTop + 10 + fl * 12,
        x2: 1000,
        y2: webTop + 10 + fl * 12,
        class: "fabric-motion-line"
      }));
    }

    var lbl = el("text", {
      x: 500,
      y: 165,
      "text-anchor": "middle",
      class: "axlab"
    });
    lbl.textContent = "moving fabric · continuous centre web";
    svg.appendChild(lbl);

    /* pipe banks */
    svg.appendChild(el("rect", {
      x: margin - 12, y: 30, width: usable + 24, height: 14, rx: 7, class: "pipe"
    }));
    svg.appendChild(el("rect", {
      x: margin - 12, y: 276, width: usable + 24, height: 14, rx: 7, class: "pipe"
    }));

    ["top", "bottom"].forEach(function (side) {
      var g = el("g", { class: side });

      for (var i = 0; i < N; i++) {
        var cx = margin + i * step;
        var ng = el("g", {
          class: "nozzle",
          "data-side": side,
          "data-i": (i + 1)
        });

        if (side === "top") {
          ng.appendChild(el("line", {
            class: "stem", x1: cx, y1: 44, x2: cx, y2: 58, "stroke-width": 2
          }));
          ng.appendChild(el("path", {
            class: "cone",
            d: "M" + (cx - 3) + " 60 L" + (cx + 3) + " 60 L" +
               (cx + 24) + " " + webTop + " L" + (cx - 24) + " " + webTop + " Z"
          }));
          ng.appendChild(el("line", {
            class: "spray-core",
            x1: cx, y1: 65, x2: cx, y2: webTop - 2
          }));
          addDroplets(ng, cx, side);
          ng.appendChild(el("circle", {
            class: "dome", cx: cx, cy: 58, r: 7
          }));
          ng.appendChild(el("circle", {
            class: "hit", cx: cx, cy: 58, r: 16
          }));
        } else {
          ng.appendChild(el("line", {
            class: "stem", x1: cx, y1: 276, x2: cx, y2: 262, "stroke-width": 2
          }));
          ng.appendChild(el("path", {
            class: "cone",
            d: "M" + (cx - 3) + " 260 L" + (cx + 3) + " 260 L" +
               (cx + 24) + " " + webBot + " L" + (cx - 24) + " " + webBot + " Z"
          }));
          ng.appendChild(el("line", {
            class: "spray-core",
            x1: cx, y1: 255, x2: cx, y2: webBot + 2
          }));
          addDroplets(ng, cx, side);
          ng.appendChild(el("circle", {
            class: "dome", cx: cx, cy: 262, r: 7
          }));
          ng.appendChild(el("circle", {
            class: "hit", cx: cx, cy: 262, r: 16
          }));
        }

        (function (ng, side, idx) {
          ng.addEventListener("mouseenter", function (e) {
            showTip(e, side, idx);
          });
          ng.addEventListener("mousemove", posTip);
          ng.addEventListener("mouseleave", hideTip);
          ng.addEventListener("focus", function (e) {
            showTip(e, side, idx);
          });
          ng.addEventListener("blur", hideTip);
          ng.addEventListener("click", function () {
            confirmNozzle(ng);
          });
          ng.setAttribute("tabindex", "0");
        })(ng, side, i + 1);

        g.appendChild(ng);
      }

      svg.appendChild(g);
    });

    /* bank labels */
   /* bank labels */
[
  ["Bank A · 12 nozzles · Front view", 22],
  ["Bank B · 12 nozzles · Back view", 308]
].forEach(function (o) {
  var t = el("text", {
    x: margin - 12,
    y: o[1],
    class: "axlab"
  });

  t.textContent = o[0];
  svg.appendChild(t);
});

    /* width scale */
    var sc = el("g", {});
    sc.appendChild(el("line", {
      x1: margin,
      y1: 306,
      x2: margin + usable,
      y2: 306,
      stroke: "rgba(15,21,29,.22)",
      "stroke-width": 1
    }));

    [[margin, "0"], [margin + usable, "2 000 mm"]].forEach(function (o) {
      sc.appendChild(el("line", {
        x1: o[0],
        y1: 302,
        x2: o[0],
        y2: 310,
        stroke: "rgba(15,21,29,.22)",
        "stroke-width": 1
      }));

      var t = el("text", {
        x: o[0],
        y: 320,
        "text-anchor": "middle",
        class: "axlab"
      });
      t.textContent = o[1];
      sc.appendChild(t);
    });

    var pt = el("text", {
      x: margin + step / 2,
      y: 300,
      "text-anchor": "middle",
      class: "axlab"
    });
    pt.textContent = PITCH.toFixed(1) + " mm pitch";
    sc.appendChild(pt);
    svg.appendChild(sc);

    applyState();
  }

  function showTip(e, side, idx) {
    var mm = Math.round((idx - 1) * PITCH);
    var bank = side === "top" ? "Bank A" : "Bank B";
    var enabled = state.power === "on" && (state.mode === "dual" || side === "top");

    tip.textContent =
      "Nozzle " + (idx < 10 ? "0" + idx : idx) +
      " · " + bank +
      " · " + mm + " mm across" +
      " · " + (enabled ? "SPRAYING" : "OFF");

    tip.classList.add("show");
    posTip(e);
  }

  function posTip(e) {
    var w = svg.parentElement.getBoundingClientRect();
    tip.style.left = (e.clientX - w.left) + "px";
    tip.style.top = (e.clientY - w.top) + "px";
  }

  function hideTip() {
    tip.classList.remove("show");
  }

  function confirmNozzle(ng) {
    var enabled =
      state.power === "on" &&
      (state.mode === "dual" || ng.dataset.side === "top");

    if (!enabled) return;

    ng.classList.add("pulseon");
    setTimeout(function () {
      ng.classList.remove("pulseon");
    }, 260);
  }

  function setPressed(buttons, current) {
    buttons.forEach(function (b) {
      var active = b === current;
      b.classList.toggle("active", active);
      b.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function applyState() {
    var isOn = state.power === "on";
    var single = state.mode === "single";

    svg.classList.toggle("spray-on", isOn);
    svg.classList.toggle("spray-off", !isOn);
    svg.classList.toggle("mode-single", single);

    var bar = $(".array-controlbar");
    if (bar) bar.classList.toggle("is-off", !isOn);

    var stateText = $("#arrayState");
    if (stateText) {
      stateText.textContent = !isOn
        ? "SPRAY OFF"
        : single
          ? "12 NOZZLES ACTIVE · BANK A"
          : "24 NOZZLES ACTIVE · BOTH BANKS";
    }

    var desc = $("#arrayModeDesc");
    if (desc) {
      if (!isOn) {
        desc.textContent =
          "Spray OFF — both banks are parked. The centre fabric continues moving, ready for the next finishing cycle.";
      } else if (single) {
        desc.textContent =
          "Spray ON · One face — all 12 Bank A nozzles fire together continuously. Bank B remains OFF while the fabric keeps moving.";
      } else {
        desc.textContent =
          "Spray ON · Both faces — all 24 nozzles fire together continuously, with Bank A and Bank B spraying the moving fabric at the same time.";
      }
    }
  }

  build();

  /* Power control */
  $$(".array-power-toggle button").forEach(function (b) {
    b.onclick = function () {
      state.power = b.dataset.power === "off" ? "off" : "on";
      setPressed($$(".array-power-toggle button"), b);
      applyState();
    };
  });

  /* Face selection */
  $$(".array-toggle button").forEach(function (b) {
    b.onclick = function () {
      state.mode = b.dataset.mode === "single" ? "single" : "dual";
      setPressed($$(".array-toggle button"), b);
      applyState();
    };
  });
})();



/* ============================================================ ARRAY IMAGE SHOWCASE
   Two independent 3-image viewers:
   - no thumbnails required
   - previous / next arrows read image data from JSON inside each gallery
   - keyboard left/right support
   - lightbox remains supported
   ============================================================ */
(function () {
  var galleries = $$('[data-image-gallery]');
  if (!galleries.length) return;

  var lightbox = $('#arrayImageLightbox');
  var lightboxImg = $('#arrayImageLightboxImg');
  var lightboxKicker = $('#arrayImageLightboxKicker');
  var lightboxTitle = $('#arrayImageLightboxTitle');
  var lightboxClose = lightbox ? $('.array-image-lightbox-close', lightbox) : null;
  var transitionMs = RED ? 0 : 180;

  function mod(n, len) { return ((n % len) + len) % len; }

  function getItems(gallery) {
    if (gallery.__galleryItems) return gallery.__galleryItems;
    var dataNode = $('[data-gallery-data]', gallery);
    var items = [];
    if (dataNode) {
      try { items = JSON.parse(dataNode.textContent || '[]'); }
      catch (e) { items = []; }
    }
    gallery.__galleryItems = items;
    return items;
  }

  function currentIndex(gallery) {
    var i = parseInt(gallery.dataset.galleryIndex || '0', 10);
    return isFinite(i) ? i : 0;
  }

  function updateContent(gallery, item, index) {
    var main = $('[data-gallery-main]', gallery);
    var kicker = $('[data-gallery-kicker]', gallery);
    var title = $('[data-gallery-title]', gallery);
    var desc = $('[data-gallery-desc]', gallery);
    var counter = $('[data-gallery-counter]', gallery);
    var items = getItems(gallery);
    if (!main || !item || !items.length) return;

    main.src = item.src || main.src;
    main.alt = item.alt || item.title || 'Gallery image';
    if (kicker) kicker.textContent = item.kicker || '';
    if (title) title.textContent = item.title || '';
    if (desc) desc.textContent = item.desc || '';
    if (counter) {
      counter.textContent = String(index + 1).padStart(2, '0') + ' / ' + String(items.length).padStart(2, '0');
    }
    gallery.dataset.galleryIndex = String(index);
  }

  function setGallery(gallery, index, direction) {
    var items = getItems(gallery);
    var stage = $('[data-gallery-stage]', gallery) || $('.image-gallery-stage', gallery);
    var main = $('[data-gallery-main]', gallery);
    if (!items.length || !main) return;

    index = mod(index, items.length);
    var oldIndex = currentIndex(gallery);
    var dir = direction || (index < oldIndex ? 'prev' : 'next');
    if (index === oldIndex) dir = 'none';

    if (!stage || RED || dir === 'none' || !main.animate) {
      updateContent(gallery, items[index], index);
      return;
    }
    if (stage.dataset.transitioning === 'true') return;

    stage.dataset.transitioning = 'true';
    gallery.classList.add('gallery-copy-changing');

    var outX = dir === 'prev' ? 34 : -34;
    var inX = -outX;
    var outAnim = main.animate([
      { opacity: 1, transform: 'translateX(0) scale(1)' },
      { opacity: 0, transform: 'translateX(' + outX + 'px) scale(.992)' }
    ], {
      duration: transitionMs,
      easing: 'cubic-bezier(.4,0,.2,1)',
      fill: 'forwards'
    });

    outAnim.finished.then(function () {
      updateContent(gallery, items[index], index);

      /* Decode the replacement image before the entrance where supported. */
      var ready = main.decode ? main.decode().catch(function () {}) : Promise.resolve();
      ready.then(function () {
        main.animate([
          { opacity: 0, transform: 'translateX(' + inX + 'px) scale(.992)' },
          { opacity: 1, transform: 'translateX(0) scale(1)' }
        ], {
          duration: RED ? 0 : 300,
          easing: 'cubic-bezier(.22,.61,.36,1)',
          fill: 'forwards'
        });
        gallery.classList.remove('gallery-copy-changing');
        setTimeout(function () { stage.dataset.transitioning = 'false'; }, RED ? 0 : 310);
      });
    }).catch(function () {
      updateContent(gallery, items[index], index);
      gallery.classList.remove('gallery-copy-changing');
      stage.dataset.transitioning = 'false';
    });
  }

  function navigate(gallery, delta) {
    var items = getItems(gallery);
    if (!items.length) return;
    var nextIndex = mod(currentIndex(gallery) + delta, items.length);
    setGallery(gallery, nextIndex, delta < 0 ? 'prev' : 'next');
  }

  function openLightbox(gallery) {
    if (!lightbox || !lightboxImg) return;
    var main = $('[data-gallery-main]', gallery);
    var kicker = $('[data-gallery-kicker]', gallery);
    var title = $('[data-gallery-title]', gallery);
    if (!main) return;
    lightboxImg.src = main.currentSrc || main.src;
    lightboxImg.alt = main.alt || '';
    if (lightboxKicker) lightboxKicker.textContent = kicker ? kicker.textContent : '';
    if (lightboxTitle) lightboxTitle.textContent = title ? title.textContent : '';
    lightbox.dataset.galleryType = gallery.dataset.imageGallery || '';
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden','false');
    document.body.classList.add('array-lightbox-open');
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden','true');
    lightbox.dataset.galleryType = '';
    document.body.classList.remove('array-lightbox-open');
  }

  function activeLightboxGallery() {
    if (!lightbox) return null;
    var type = lightbox.dataset.galleryType;
    for (var i = 0; i < galleries.length; i++) {
      if (galleries[i].dataset.imageGallery === type) return galleries[i];
    }
    return null;
  }

  function refreshLightbox(gallery, direction) {
    if (!lightbox || !lightboxImg || !lightbox.classList.contains('is-open')) return;
    var main = $('[data-gallery-main]', gallery);
    var kicker = $('[data-gallery-kicker]', gallery);
    var title = $('[data-gallery-title]', gallery);
    if (!main) return;

    var outX = direction === 'prev' ? 26 : -26;
    var inX = -outX;

    if (!lightboxImg.animate || RED) {
      lightboxImg.src = main.currentSrc || main.src;
      lightboxImg.alt = main.alt || '';
      if (lightboxKicker) lightboxKicker.textContent = kicker ? kicker.textContent : '';
      if (lightboxTitle) lightboxTitle.textContent = title ? title.textContent : '';
      return;
    }

    var anim = lightboxImg.animate([
      { opacity: 1, transform: 'translateX(0) scale(1)' },
      { opacity: 0, transform: 'translateX(' + outX + 'px) scale(.995)' }
    ], { duration: 140, easing: 'ease', fill: 'forwards' });

    anim.finished.then(function () {
      lightboxImg.src = main.currentSrc || main.src;
      lightboxImg.alt = main.alt || '';
      if (lightboxKicker) lightboxKicker.textContent = kicker ? kicker.textContent : '';
      if (lightboxTitle) lightboxTitle.textContent = title ? title.textContent : '';
      lightboxImg.animate([
        { opacity: 0, transform: 'translateX(' + inX + 'px) scale(.995)' },
        { opacity: 1, transform: 'translateX(0) scale(1)' }
      ], { duration: 220, easing: 'cubic-bezier(.22,.61,.36,1)', fill: 'forwards' });
    }).catch(function () {});
  }

  galleries.forEach(function (gallery) {
    var items = getItems(gallery);
    var prev = $('[data-gallery-prev]', gallery);
    var next = $('[data-gallery-next]', gallery);
    var openButton = $('[data-gallery-open]', gallery);
    var stage = $('[data-gallery-stage]', gallery) || $('.image-gallery-stage', gallery);

    gallery.dataset.galleryIndex = '0';
    if (items.length) updateContent(gallery, items[0], 0);

    if (prev) {
      prev.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        navigate(gallery, -1);
      });
    }

    if (next) {
      next.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        navigate(gallery, 1);
      });
    }

    if (openButton) openButton.addEventListener('click', function () { openLightbox(gallery); });

    if (stage) {
      stage.tabIndex = 0;
      stage.setAttribute('role', 'group');
      stage.setAttribute('aria-roledescription', 'carousel');
      stage.setAttribute('aria-label', (gallery.dataset.imageGallery || 'Image') + ' image carousel');
      stage.addEventListener('keydown', function (event) {
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          navigate(gallery, -1);
        } else if (event.key === 'ArrowRight') {
          event.preventDefault();
          navigate(gallery, 1);
        }
      });
    }
  });

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightbox) {
    lightbox.addEventListener('click', function (event) {
      if (event.target === lightbox) closeLightbox();
    });
  }

  document.addEventListener('keydown', function (event) {
    if (!lightbox || !lightbox.classList.contains('is-open')) return;
    if (event.key === 'Escape') {
      closeLightbox();
      return;
    }
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

    var gallery = activeLightboxGallery();
    if (!gallery) return;

    event.preventDefault();
    var delta = event.key === 'ArrowLeft' ? -1 : 1;
    navigate(gallery, delta);
    setTimeout(function () {
      refreshLightbox(gallery, delta < 0 ? 'prev' : 'next');
    }, transitionMs + 330);
  });
})();

/* ============================================================ GO */
if (typeof THREE === "undefined" || !THREE.GLTFLoader) {
  $("#lmsg").textContent = "THREE.JS DID NOT LOAD";
  $("#lnote").textContent = "The 3D library comes from a CDN — check the internet connection.";
} else {
  boot();
  requestAnimationFrame(frame);
}
addEventListener("load", function () { setTimeout(resize, 60); });
if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setTimeout(resize, 50); });
resize();
})();


