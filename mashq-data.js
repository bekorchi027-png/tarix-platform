// Historical events with place and year, used by the map game and the timeline game.
// y < 0 means "mil. avv." (BC). Coordinates are the event's place; for battles they are approximate.
window.EVENTS = [
// O'zbekiston va Markaziy Osiyo
{t:"Iskandar Zulqarnayn Marokandani (Samarqand) egalladi", y:-329, lat:39.67, lng:66.98, r:"uz", d:"Makedoniya qo'shini So'g'diyonaga kirdi; Spitamen boshchiligida qarshilik ko'rsatildi."},
{t:"Talas jangi: arablar va Xitoy (Tan) qo'shinlari to'qnashdi", y:751, lat:42.90, lng:71.37, r:"uz", d:"Arab xalifaligi g'alaba qozondi; Markaziy Osiyoda Tan sulolasi ta'siri tugadi."},
{t:"Dandanaqon jangi: saljuqiylar G'aznaviylar ustidan g'alaba qildi", y:1040, lat:37.30, lng:62.10, r:"uz", d:"Marv yaqinida; Saljuqiylar davlatining yuksalishi boshlandi."},
{t:"Qatvon jangi: qoraxitoylar Sulton Sanjarni yengdi", y:1141, lat:39.85, lng:66.75, r:"uz", d:"Samarqand yaqinidagi Qatvon dashtida."},
{t:"O'tror mudofaasi: mo'g'ullar qamali boshlandi", y:1219, lat:42.85, lng:68.30, r:"uz", d:"Inolchiq (G'oyirxon) boshchiligida shahar besh oy mudofaa qilindi."},
{t:"Chingizxon Buxoroni egalladi", y:1220, lat:39.77, lng:64.42, r:"uz", d:"Mo'g'ullar bosqinining eng og'ir sahifalaridan biri."},
{t:"Urganch (Gurganj) mo'g'ullar tomonidan vayron qilindi", y:1221, lat:42.33, lng:59.15, r:"uz", d:"Ko'hna Urganch qamalidan so'ng to'g'on buzilib, shahar suvga bostirildi."},
{t:"Amir Temur Samarqandni davlat poytaxti qildi", y:1370, lat:39.65, lng:66.96, r:"uz", d:"Balx qurultoyidan so'ng Temur oliy hukmdor deb e'lon qilindi."},
{t:"Ulug'bek rasadxonasi qurildi", y:1428, lat:39.674, lng:67.006, r:"uz", d:"Samarqanddagi Ko'hak tepaligida; \"Ziji jadidi Ko'ragoniy\" shu yerda tuzildi."},
{t:"Bobur Kobulni egalladi", y:1504, lat:34.53, lng:69.17, r:"uz", d:"Movarounnahrdan chiqqan Bobur Kobulni o'z markaziga aylantirdi."},
{t:"Qo'qon xonligi tashkil topdi", y:1709, lat:40.53, lng:70.94, r:"uz", d:"Shohruhbiy asos solgan Minglar sulolasi davlati."},
{t:"Toshkent Rossiya imperiyasi qo'shinlari tomonidan bosib olindi", y:1865, lat:41.31, lng:69.28, r:"uz", d:"General M. Chernyayev boshchiligida; Alimqul amirlashkar shu yil halok bo'lgan."},
{t:"Samarqand Rossiya imperiyasi tomonidan bosib olindi", y:1868, lat:39.65, lng:66.96, r:"uz", d:"Buxoro amirligi Rossiya protektoratiga aylandi."},
{t:"Xiva xonligi Rossiya protektoratiga aylandi (Gandimiyon shartnomasi)", y:1873, lat:41.38, lng:60.36, r:"uz", d:"General Kaufman yurishidan so'ng."},
{t:"Qo'qon xonligi tugatildi", y:1876, lat:40.53, lng:70.94, r:"uz", d:"Hududi Farg'ona viloyati sifatida Turkiston general-gubernatorligiga qo'shildi."},
{t:"Andijon qo'zg'oloni", y:1898, lat:40.78, lng:72.34, r:"uz", d:"Dukchi Eshon boshchiligida chor hukumatiga qarshi."},
{t:"Jizzax qo'zg'oloni", y:1916, lat:40.12, lng:67.84, r:"uz", d:"Mardikorlikka olish to'g'risidagi farmonga qarshi xalq qo'zg'oloni."},
{t:"Turkiston muxtoriyati e'lon qilindi", y:1917, lat:40.54, lng:70.94, r:"uz", d:"Qo'qonda bo'lib o'tgan IV Favqulodda o'lka musulmonlari qurultoyida."},
{t:"Buxoro amirligi tugatildi, BXSR tuzildi", y:1920, lat:39.77, lng:64.42, r:"uz", d:"Qizil Armiya Buxoroni egalladi; Buxoro Xalq Sovet Respublikasi e'lon qilindi."},
{t:"Xorazm Xalq Sovet Respublikasi tuzildi", y:1920, lat:41.38, lng:60.36, r:"uz", d:"Xiva xonligi tugatildi."},
{t:"Toshkent zilzilasi", y:1966, lat:41.31, lng:69.28, r:"uz", d:"26-aprel kuni shahar markazi katta vayronagarchilikka uchradi."},
{t:"O'zbekiston mustaqilligi e'lon qilindi", y:1991, lat:41.31, lng:69.28, r:"uz", d:"31-avgust kuni Oliy Kengash sessiyasida."},
// Jahon tarixi: qadimgi dunyo
{t:"Marafon jangi", y:-490, lat:38.15, lng:23.96, r:"j", d:"Afinaliklar fors qo'shinini yengdi."},
{t:"Salamin dengiz jangi", y:-480, lat:37.95, lng:23.55, r:"j", d:"Femistokl boshchiligidagi yunon floti forslar ustidan g'alaba qildi."},
{t:"Gavgamela jangi", y:-331, lat:36.36, lng:43.40, r:"j", d:"Iskandar Doro III ni yengdi; Ahamoniylar davlati quladi."},
{t:"Kanny jangi", y:-216, lat:41.31, lng:16.13, r:"j", d:"Gannibal Rim qo'shinini qurshab yo'q qildi (Ikkinchi Puni urushi)."},
{t:"Karfagen vayron qilindi", y:-146, lat:36.85, lng:10.32, r:"j", d:"Uchinchi Puni urushi Rim g'alabasi bilan tugadi."},
{t:"Vezuviy otilishi: Pompey shahri ko'mildi", y:79, lat:40.75, lng:14.49, r:"j", d:"Shahar kul ostida qolib, keyinchalik arxeologlar tomonidan ochildi."},
// O'rta asrlar
{t:"Puatye jangi", y:732, lat:46.58, lng:0.34, r:"j", d:"Karl Martell arablar yurishini to'xtatdi."},
{t:"Gastings jangi", y:1066, lat:50.91, lng:0.49, r:"j", d:"Normandiya gersogi Vilgelm Angliyani bosib oldi."},
{t:"Kulikovo jangi", y:1380, lat:53.67, lng:38.66, r:"j", d:"Dmitriy Donskoy Mamay qo'shinini yengdi."},
{t:"Anqara jangi: Amir Temur Boyazid I ni yengdi", y:1402, lat:40.10, lng:32.95, r:"j", d:"Usmonli sulton asir olindi; Yevropa uchun Usmonli xavfi vaqtincha kamaydi."},
{t:"Grunvald jangi", y:1410, lat:53.48, lng:20.10, r:"j", d:"Polsha-Litva qo'shini Tevton ordenini tor-mor etdi."},
{t:"Konstantinopol usmonlilar tomonidan fath etildi", y:1453, lat:41.01, lng:28.97, r:"j", d:"Sulton Mehmed II; Vizantiya imperiyasi tugadi."},
{t:"Kolumb Amerika qirg'oqlariga yetib keldi", y:1492, lat:24.05, lng:-74.50, r:"j", d:"Bagama orollaridagi San-Salvador oroliga tushdi."},
// Yangi davr
{t:"Chaldiron jangi", y:1514, lat:39.14, lng:43.90, r:"j", d:"Usmonli Salim I Safaviy Ismoil I ni yengdi."},
{t:"Panipat jangi: Bobur Ibrohim Lodiyni yengdi", y:1526, lat:29.39, lng:76.97, r:"j", d:"Hindistonda Boburiylar davlatiga asos solindi."},
{t:"Mohach jangi", y:1526, lat:45.99, lng:18.68, r:"j", d:"Sulaymon Qonuniy Vengriya qo'shinini yengdi."},
{t:"Lepanto dengiz jangi", y:1571, lat:38.25, lng:21.10, r:"j", d:"Muqaddas liga floti Usmonli flotini yengdi."},
{t:"AQSH Mustaqillik deklaratsiyasi qabul qilindi", y:1776, lat:39.95, lng:-75.15, r:"j", d:"Filadelfiyada, 4-iyul kuni."},
{t:"Bastiliya qal'asi olindi: Fransuz inqilobi boshlandi", y:1789, lat:48.853, lng:2.369, r:"j", d:"14-iyul Fransiyada milliy bayram."},
{t:"Borodino jangi", y:1812, lat:55.52, lng:35.82, r:"j", d:"Napoleon armiyasi va Kutuzov qo'shini o'rtasida."},
{t:"Vaterloo jangi", y:1815, lat:50.68, lng:4.41, r:"j", d:"Napoleonning so'nggi mag'lubiyati."},
{t:"Gettisberg jangi", y:1863, lat:39.81, lng:-77.23, r:"j", d:"AQSH fuqarolar urushida burilish nuqtasi."},
{t:"Meydzi islohotlari boshlandi", y:1868, lat:35.68, lng:139.69, r:"j", d:"Yaponiyada imperator hokimiyati tiklanib, modernizatsiya boshlandi."},
// Eng yangi davr
{t:"Versal tinchlik shartnomasi imzolandi", y:1919, lat:48.80, lng:2.12, r:"j", d:"Birinchi jahon urushi yakunlari rasmiylashtirildi."},
{t:"Stalingrad jangi", y:1942, lat:48.71, lng:44.51, r:"j", d:"Ikkinchi jahon urushida tub burilish (1942-1943)."},
{t:"Yalta (Qrim) konferensiyasi", y:1945, lat:44.47, lng:34.14, r:"j", d:"Stalin, Ruzvelt va Cherchill urushdan keyingi tartibni kelishdi."},
{t:"Xirosimaga atom bombasi tashlandi", y:1945, lat:34.39, lng:132.45, r:"j", d:"6-avgust kuni; uch kundan keyin Nagasaki."},
{t:"Berlin devori qulatildi", y:1989, lat:52.516, lng:13.377, r:"j", d:"9-noyabr; bir yildan so'ng Germaniya birlashdi."}
];
window.ERAS = [
  {id:"qad", name:"Qadimgi dunyo", from:-4000, to:499},
  {id:"orta", name:"O'rta asrlar", from:500, to:1499},
  {id:"yangi", name:"Yangi davr", from:1500, to:1913},
  {id:"eng", name:"Eng yangi davr", from:1914, to:2100}
];
