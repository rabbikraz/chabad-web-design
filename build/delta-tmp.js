MembershipBuilder() {
var root = $all('form.userform-form').filter(function (f) {
return $all('.form-label-left label, .form-label label', f).some(function (l) {
return /membership level/i.test(l.textContent);
});
})[0];
if (!root) return;
root.classList.add('sb-mf');
document.body.classList.add('sb-memform');
function stripLbl(s) {
return String(s || '').replace(/\s+/g, ' ').trim().toLowerCase()
.replace(/^\((basic|chai|silver|gold)\)\s*/, '');
}
function labelOf(li) {
var l = li.querySelector('.form-label-left label, .form-label label');
if (!l) return '';
var c = l.cloneNode(true);
var star = c.querySelector('.form-required');
if (star) star.parentNode.removeChild(star);
return stripLbl(c.textContent);
}
function allLis() { return $all('li.form-line, li.form-input-wide', root); }
function lisByLabel(re) {
return allLis().filter(function (li) { return re.test(labelOf(li)); });
}
function headingLi(txt) {
return allLis().filter(function (li) {
var h = li.querySelector('.form-header');
return h && stripLbl(h.textContent) === txt;
})[0] || null;
}
function spouseLis() {
var set = lisByLabel(/^(spouse |anniversary$)/);
var h = headingLi('spouse');
if (h) set.push(h);
return set;
}
function liShown(li) { return !!(li && li.offsetParent !== null); }
function activeLi(re) {
var vis = lisByLabel(re).filter(liShown);
var answered = vis.filter(function (li) {
return $all('input', li).some(function (f) {
if (f.type === 'radio' || f.type === 'checkbox') return f.checked;
return !!String(f.value || '').trim();
});
});
return answered[0] || vis[0] || null;
}
function checkedIn(li) {
var v = '';
if (li) $all('input[type="radio"]', li).forEach(function (r) { if (r.checked) v = r.value; });
return v;
}
function tier() {
return checkedIn(lisByLabel(/^membership level/)[0] || null);
}
function household() { return checkedIn(activeLi(/^i am joining as/)); }
function parents() { return checkedIn(activeLi(/^parents at home/)); }
function kidsCount() {
var li = activeLi(/^number of children/);
var input = li && li.querySelector('input');
return input ? parseInt(input.value, 10) || 0 : 0;
}
function hasSpouse() {
var hh = household();
if (hh === 'Couple') return true;
if (hh === 'Family') return !/single/i.test(parents() || '');
return hh === '';
}
var intro = $('.form-html', root);
if (intro) {
var MOJI = new RegExp(String.fromCharCode(226) + String.fromCharCode(8364) +
'[' + String.fromCharCode(8220) + String.fromCharCode(8221) + ']', 'g');
$all('p', intro).forEach(function (p) {
if (MOJI.test(p.textContent)) {
MOJI.lastIndex = 0;
p.textContent = p.textContent.replace(MOJI, ' ' + String.fromCharCode(8212) + ' ').replace(/\s{2,}/g, ' ');
}
MOJI.lastIndex = 0;
if (/^(MONTHLY PRICING|BENEFITS)$/.test(p.textContent.trim())) {
p.classList.add('sb-mf-plabel');
}
});
}
$all('.form-label-left label, .form-label label', root).forEach(function (lab) {
var m = /^\s*\((Basic|Chai|Silver|Gold)\)\s*/.exec(lab.textContent);
if (!m) return;
var star = lab.querySelector('.form-required');
lab.textContent = lab.textContent.replace(m[0], ' ');
if (star) lab.appendChild(star);
});
var famSect = null;
if ($all('.form-header-group', root).length <= 1) {
var sectionBefore = function (li, title, sub) {
if (!li || !li.parentNode) return null;
var s = el('li', 'sb-mf-sect');
var h = el('div', 'sb-mf-sect-h');
h.textContent = title;
s.appendChild(h);
if (sub) {
var p = el('p', 'sb-mf-sect-sub');
p.textContent = sub;
s.appendChild(p);
}
li.parentNode.insertBefore(s, li);
return s;
};
sectionBefore(lisByLabel(/^(full )?name$/)[0], 'Your Information');
famSect = sectionBefore(lisByLabel(/^spouse first name$/)[0], 'Your Family',
'Spouse and children details are required when they apply - every child at home must be listed.');
sectionBefore(lisByLabel(/^total$/)[0], 'Payment');
}
var totalLi = lisByLabel(/^total$/)[0];
if (totalLi && !totalLi.querySelector('.sb-mf-total-note')) {
var note = el('div', 'sb-mf-total-note');
note.textContent = 'Your monthly membership amount, calculated from your selections above.';
var cell = totalLi.querySelector('.form-input') || totalLi;
cell.appendChild(note);
}
function setSpouseVisible(show) {
spouseLis().forEach(function (li) {
li.style.display = show ? '' : 'none';
if (!show) {
$all('input, select', li).forEach(function (f) {
if (f.type === 'radio' || f.type === 'checkbox') f.checked = false;
else f.value = '';
});
}
});
var anyFamily = show || household() === 'Family' || household() === '';
if (famSect) famSect.style.display = anyFamily ? '' : 'none';
var ch = headingLi('children');
if (ch) ch.style.display = (household() === 'Family' || household() === '') ? '' : 'none';
}
function refresh() { setSpouseVisible(hasSpouse()); }
root.addEventListener('change', function (e) {
var t = e.target;
if (t && t.type === 'radio') refresh();
if (t && (t.type === 'number' || t.classList.contains('form-number-input'))) refresh();
if (t && t.closest && t.closest('li.sb-mf-invalid')) clearInvalid(t.closest('li'));
});
root.addEventListener('input', function (e) {
var li = e.target && e.target.closest ? e.target.closest('li.sb-mf-invalid') : null;
if (li) clearInvalid(li);
});
refresh();
var errbar = el('div', 'sb-mf-errbar');
var submitLi = document.getElementById('id_64');
if (submitLi && submitLi.parentNode) submitLi.parentNode.insertBefore(errbar, submitLi);
function markInvalid(node) {
var li = node && node.closest ? node.closest('li.form-line') : null;
if (li) li.classList.add('sb-mf-invalid');
return li || node;
}
function clearInvalid(li) { if (li) li.classList.remove('sb-mf-invalid'); }
function liVisible(li) { return !!(li && li.offsetParent !== null); }
function liFilled(li) {
var ok = true;
var radios = [];
$all('input, select, textarea', li).forEach(function (f) {
if (f.type === 'hidden') return;
if (f.type === 'radio' || f.type === 'checkbox') { radios.push(f); return; }
if (!String(f.value || '').trim()) ok = false;
});
if (radios.length && !radios.some(function (r) { return r.checked; })) ok = false;
return ok;
}
function validate() {
$all('li.sb-mf-invalid', root).forEach(clearInvalid);
var problems = [];
var firstBad = null;
function bad(msg, node) {
problems.push(msg);
var li = node ? markInvalid(node) : null;
if (li && !firstBad) firstBad = li;
}
function requireLi(li, msg) {
if (!li || !liVisible(li)) return;
if (!liFilled(li)) bad(msg, li.querySelector('input, select, textarea') || li);
}
var t = tier();
if (!t) return null; // the builder's own required-check handles this
var hh = household();
var hhLi = activeLi(/^i am joining as/);
if (!hh && hhLi) {
bad('Please tell us who is joining: Single, Couple, or Family.',
hhLi.querySelector('input'));
}
if (hh === 'Family') {
var parLi = activeLi(/^parents at home/);
if (!parents() && parLi) {
bad('Please choose Two parents or Single parent - your membership amount depends on it.',
parLi.querySelector('input'));
}
var kidsLi = activeLi(/^number of children/);
if (kidsCount() < 1 && kidsLi) {
bad('Please enter how many children are at home (a household with no children at home joins as a Couple or Single).',
kidsLi.querySelector('input'));
}
lisByLabel(/^child \d+ (name|birthday)/).forEach(function (li) {
requireLi(li, 'Please fill in the name and birthday of every child.');
});
}
if (hh === 'Couple' || (hh === 'Family' && !/single/i.test(parents() || ''))) {
[/^spouse first name$/, /^spouse last name$/, /^spouse birthday$/,
/^spouse gender$/, /^spouse jewishness$/].forEach(function (re) {
var li = lisByLabel(re)[0];
if (!li) return;
var lbl = labelOf(li);
requireLi(li, lbl.charAt(0).toUpperCase() + lbl.slice(1) + ' is required.');
});
}
if (!problems.length) return null;
var seen = {};
problems = problems.filter(function (p) {
if (seen[p]) return false;
seen[p] = 1;
return true;
});
return { problems: problems, firstBad: firstBad };
}
document.addEventListener('submit', function (event) {
if (event.target !== root) return;
var result = null;
try { result = validate(); } catch (e) { return; }
if (!result) { errbar.classList.remove('sb-on'); return; }
event.preventDefault();
event.stopPropagation();
errbar.textContent = result.problems.join(' ');
errbar.classList.add('sb-on');
var target = result.firstBad || errbar;
if (target.scrollIntoView) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
}, true);
}
function init() {
document.body.classList.remove('sb-nojs');
document.body.classList.add('sb-js');
if (isHome()) document.body.classList.add('sb-home');
safe('page-rules', runPageRules);
safe('page-theme', applyPageTheme);
safe('nav-labels', normalizeNavLabels);
safe('branding', enhanceBranding);
safe('mobile-menu', initMobileMenu);
var candles = null;
safe('candle-data', function () { candles = getCandleData(); });
var heroImg = null;
if (isHome()) {
safe('hero', function () {
var imgs = $all('.hp-row-first .promo_slider .slide_wrapper img');
var photo = imgs.filter(function (im) {
return /\.jpe?g(\?|$)/i.test(im.getAttribute('src') || '');
})[0] || imgs[0];
heroImg = photo ? photo.getAttribute('src') : null;
buildHero();
});
safe('welcome', function () { buildWelcome(heroImg); });
safe('programs', wrapPrograms);
safe('events-rail', buildEventsRail);
safe('shabbat-band', function () { buildShabbatBand(candles); });
safe('photos', initPhotosMosaic);
safe('subscribe', enhanceSubscribe);
}
safe('footer', buildFooter);
safe('feedback-bar', relocateFeedbackBar);
safe('event-hero', buildEventHero);
safe('form-autofill', initFormAutofill);
safe('credit-card', initCreditCard);
safe('sponsor-tiers', initSponsorTiers);
safe('event-listing', themeEventListing);
safe('event-description-clamp', initEventDescriptionClamp);
safe('hh-seats', initHHSeats);
safe('membership-builder', initMembershipBuilder