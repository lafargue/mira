import type { Locale } from "@/lib/prefs";

export type Messages = {
  tagline: string;
  howToPlay: string;
  daily: string;
  dailyAgain: string;
  endless: string;
  ranking: string;
  settings: string;
  streak: string;
  enter: string;
  leave: string;
  back: string;
  close: string;
  soundOn: string;
  soundOff: string;
  play: string;
  tap: string;
  menu: string;
  retry: string;
  challenge: string;
  copied: string;
  shared: string;
  shareFail: string;
  you: string;
  local: string;
  appearance: string;
  appearanceHint: string;
  themeSystem: string;
  themeDark: string;
  themeLight: string;
  language: string;
  languageHint: string;
  langEs: string;
  langEn: string;
  langFr: string;
  langDe: string;
  loginTitle: string;
  loginBody: string;
  continueWith: string;
  authOff: string;
  backToPlay: string;
  rankingDaily: string;
  rankingEndless: string;
  yourPlace: string;
  of: string;
  yourMark: string;
  signInToPublish: string;
  rankingEmptyDaily: string;
  rankingEmptyEndless: string;
  rankingLoadFail: string;
  rankingOnlyYou: string;
  rankingTodayOnly: string;
  rankingNobody: string;
  rankingNobodyHint: string;
  signInToAppear: string;
  scorePosted: string;
  scoreFail: string;
  scorePosting: string;
  signInToBeSeen: string;
  resultToday: string;
  resultEnd: string;
  record: string;
  pulsesLeft: string;
  pressure: string;
  holdHint: string;
  coach: string;
  colorRose: string;
  colorGreen: string;
  colorBlue: string;
  tileAria: string;
  playsTitle: string;
  playsIntro: string;
  comboHowPulso: string;
  comboHowEco: string;
  comboHowAcorde: string;
  comboHowHalo: string;
  comboHowIris: string;
  comboHowMira: string;
  glyphsTitle: string;
  glyphsIntro: string;
  glyphsCompact: string;
  glyphHowPulso: string;
  glyphHowEco: string;
  glyphHowMid: string;
  glyphHowIris: string;
  glyphHowMira: string;
  help1Title: string;
  help1Body: string;
  help2Title: string;
  help2Body: string;
  help3Title: string;
  help3Body: string;
  help4Title: string;
  help4Body: string;
  diagramCaption: string;
  tut1: string;
  tut1b: string;
  tut2: string;
  tut2b: string;
  tut3: string;
  tut3b: string;
  shareStreak: string;
  sharePts: string;
  metaDescription: string;
  credits: string;
  tip: string;
  tipNeed: string;
  tipDailyWarn: string;
  helpedMark: string;
  helpedHint: string;
  grantHint: string;
};

const es: Messages = {
  tagline: "Toca un color. Se come en cruz hasta chocar con otro.",
  howToPlay: "Cómo se juega",
  daily: "Diario",
  dailyAgain: "Diario · repetir",
  endless: "Sin fin",
  ranking: "Ranking",
  settings: "Ajustes",
  streak: "Racha",
  enter: "Entrar",
  leave: "Salir",
  back: "Volver",
  close: "Cerrar",
  soundOn: "Activar sonido",
  soundOff: "Silenciar",
  play: "Jugar",
  tap: "Tocar",
  menu: "Menú",
  retry: "Otra vez",
  challenge: "Retar a un amigo",
  copied: "Copiado",
  shared: "Hecho",
  shareFail: "No se pudo compartir",
  you: "tú",
  local: "local",
  appearance: "Aspecto",
  appearanceHint: "El sistema sigue el del teléfono. Puedes fijar claro u oscuro.",
  themeSystem: "Sistema",
  themeDark: "Oscuro",
  themeLight: "Claro",
  language: "Idioma",
  languageHint: "Cambia el texto del juego. Los nombres de las jugadas se quedan.",
  langEs: "Español",
  langEn: "English",
  langFr: "Français",
  langDe: "Deutsch",
  loginTitle: "Entra para el ranking",
  loginBody: "Juega sin cuenta. Para subir tu marca y ver a los demás, entra con Google o X.",
  continueWith: "Continuar con",
  authOff: "El acceso está desactivado.",
  backToPlay: "Volver a jugar",
  rankingDaily: "Diario",
  rankingEndless: "Sin fin",
  yourPlace: "Tu puesto",
  of: "de",
  yourMark: "Tu marca",
  signInToPublish: "entra con tu cuenta para publicarla",
  rankingEmptyDaily: "El diario de hoy. Hay que entrar con tu cuenta para aparecer.",
  rankingEmptyEndless: "La mejor marca de cada cuenta.",
  rankingLoadFail: "No se pudo cargar el ranking.",
  rankingOnlyYou: "De momento solo está tu marca. Quien juegue hoy y entre con su cuenta aparece aquí.",
  rankingTodayOnly: "Solo el diario de hoy.",
  rankingNobody: "Nadie ha subido una marca todavía.",
  rankingNobodyHint: "Juega y entra con tu cuenta. La tuya abre la lista.",
  signInToAppear: "Entra con tu cuenta para aparecer",
  scorePosted: "Marca subida al ranking",
  scoreFail: "No se pudo subir la marca",
  scorePosting: "Subiendo marca…",
  signInToBeSeen: "Entra con tu cuenta para que te vean",
  resultToday: "Resultado de hoy",
  resultEnd: "Fin de la partida",
  record: "Récord",
  pulsesLeft: "pulsos",
  pressure: "Presión",
  holdHint: "Mantén pulsado para ver la cruz. Suelta para jugar.",
  coach: "Toca la ficha que late. Se comen las del mismo color en cruz.",
  colorRose: "Rosa",
  colorGreen: "Verde",
  colorBlue: "Azul",
  tileAria: "Ficha {color} {row}, {col}",
  playsTitle: "Las jugadas",
  playsIntro: "Los puntos son fichas × fichas × 10. El toque más gordo es cinco.",
  comboHowPulso: "Una sola ficha.",
  comboHowEco: "Dos del mismo color en cruz.",
  comboHowAcorde: "Tres en cruz.",
  comboHowHalo: "Cuatro en cruz.",
  comboHowIris: "Cinco en cruz. El toque más gordo.",
  comboHowMira: "Al caer, cuatro o más iguales en fila o columna.",
  glyphsTitle: "Los signos del diario",
  glyphsIntro: "Al terminar ves 12 signos: un pulso cada uno, de izquierda a derecha.",
  glyphsCompact: "Cada signo es un pulso, de izquierda a derecha.",
  glyphHowPulso: "Una ficha. El toque más flojo.",
  glyphHowEco: "Dos en cruz.",
  glyphHowMid: "Tres o cuatro.",
  glyphHowIris: "Cinco. El toque más gordo.",
  glyphHowMira: "Estallido al caer.",
  help1Title: "1. Toca una ficha",
  help1Body: "Desaparecen esa y todas las del mismo color en cruz. El pulso para al chocar con otro color.",
  help2Title: "2. El muro cambia de color",
  help2Body: "La ficha que paró la cruz evoluciona: rosa → verde → azul → rosa.",
  help3Title: "3. Caen y pueden estallar",
  help3Body: "Si quedan cuatro o más iguales en línea, estallan solas. Eso es una Mira y vale el doble.",
  help4Title: "4. Diario o sin fin",
  help4Body: "Diario: 12 toques, el mismo tablero para todos. Sin fin: la barra es presión. Un toque flojo la llena; Iris y Mira la bajan.",
  diagramCaption: "Tocas el rosa del centro. Se van los rosas de la cruz. Los verdes (el muro) cambian a azul.",
  tut1: "Toca un color.",
  tut1b: "Se come en cruz hasta chocar con otro.",
  tut2: "El muro cambia.",
  tut2b: "Rosa → verde → azul → rosa.",
  tut3: "Cuatro en línea",
  tut3b: "estallan solas. Eso es una Mira y duplica.",
  shareStreak: "racha",
  sharePts: "pts",
  metaDescription: "Toca un color. Resuena en cruz. Evoluciona el muro. El diario que no puedes dejar.",
  credits: "Créditos",
  tip: "Tip",
  tipNeed: "Sin créditos",
  tipDailyWarn: "Con ayuda. Esta marca no entra al ranking.",
  helpedMark: "Con ayuda",
  helpedHint: "El Tip ilumina la jugada con más puntos, también un Mira al cambiar un muro. En Diario esa marca no se publica.",
  grantHint: "Saldo de prueba al empezar. El Tip cuesta 1. En Diario, con ayuda no se publica.",
};

const en: Messages = {
  ...es,
  tagline: "Tap a color. It eats in a cross until it hits another.",
  howToPlay: "How to play",
  daily: "Daily",
  dailyAgain: "Daily · replay",
  endless: "Endless",
  settings: "Settings",
  streak: "Streak",
  enter: "Sign in",
  leave: "Sign out",
  back: "Back",
  close: "Close",
  soundOn: "Unmute",
  soundOff: "Mute",
  play: "Play",
  tap: "Tap",
  menu: "Menu",
  retry: "Play again",
  challenge: "Challenge a friend",
  copied: "Copied",
  shared: "Shared",
  shareFail: "Couldn’t share",
  you: "you",
  appearance: "Appearance",
  appearanceHint: "System follows the phone. You can lock light or dark.",
  themeSystem: "System",
  themeDark: "Dark",
  themeLight: "Light",
  language: "Language",
  languageHint: "Changes the words. Combo names stay as they are.",
  loginTitle: "Sign in for the ranking",
  loginBody: "Play without an account. To post your mark and see others, sign in with Google or X.",
  continueWith: "Continue with",
  authOff: "Sign-in is off.",
  backToPlay: "Back to play",
  rankingDaily: "Daily",
  rankingEndless: "Endless",
  yourPlace: "Your place",
  of: "of",
  yourMark: "Your mark",
  signInToPublish: "sign in to publish it",
  pressure: "Pressure",
  holdHint: "Hold to see the cross. Release to play.",
  shareStreak: "streak",
  credits: "Credits",
  tip: "Tip",
  tipNeed: "No credits",
  tipDailyWarn: "Helped. This mark stays off the ranking.",
  helpedMark: "Helped",
  helpedHint: "A Tip lights the highest-scoring play, including a Mira from a wall change. On Daily that mark is not published.",
  grantHint: "Starter balance. A Tip costs 1. On Daily, a helped mark is not published.",
};

const fr: Messages = {
  ...es,
  howToPlay: "Comment jouer",
  daily: "Quotidien",
  dailyAgain: "Quotidien · rejouer",
  endless: "Sans fin",
  ranking: "Classement",
  settings: "Réglages",
  streak: "Série",
  enter: "Entrer",
  leave: "Sortir",
  back: "Retour",
  close: "Fermer",
  play: "Jouer",
  tap: "Toucher",
  retry: "Encore",
  appearance: "Apparence",
  appearanceHint: "Système suit le téléphone. Tu peux fixer clair ou sombre.",
  themeSystem: "Système",
  themeDark: "Sombre",
  themeLight: "Clair",
  language: "Langue",
  languageHint: "Change le texte du jeu. Les noms des coups restent.",
  pressure: "Pression",
  credits: "Crédits",
  tip: "Tip",
  tipNeed: "Sans crédits",
  tipDailyWarn: "Avec aide. Cette marque n’entre pas au classement.",
  helpedMark: "Avec aide",
  helpedHint: "Le Tip éclaire le coup qui rapporte le plus, y compris un Mira en changeant un mur. Au quotidien, cette marque n’est pas publiée.",
  grantHint: "Solde d’essai au départ. Un Tip coûte 1. Au quotidien, avec aide, pas de classement.",
};

const de: Messages = {
  ...es,
  howToPlay: "So geht’s",
  daily: "Täglich",
  dailyAgain: "Täglich · nochmal",
  endless: "Endlos",
  ranking: "Rangliste",
  settings: "Einstellungen",
  streak: "Serie",
  enter: "Anmelden",
  leave: "Abmelden",
  back: "Zurück",
  close: "Schließen",
  play: "Spielen",
  tap: "Tippen",
  retry: "Nochmal",
  appearance: "Darstellung",
  appearanceHint: "System folgt dem Telefon. Hell oder dunkel kannst du festlegen.",
  themeSystem: "System",
  themeDark: "Dunkel",
  themeLight: "Hell",
  language: "Sprache",
  languageHint: "Ändert den Text. Die Zugnamen bleiben.",
  pressure: "Druck",
  credits: "Guthaben",
  tip: "Tipp",
  tipNeed: "Kein Guthaben",
  tipDailyWarn: "Mit Hilfe. Diese Marke kommt nicht in die Rangliste.",
  helpedMark: "Mit Hilfe",
  helpedHint: "Ein Tipp zeigt den Zug mit den meisten Punkten, auch ein Mira durch eine veränderte Wand. Im Daily wird die Marke nicht veröffentlicht.",
  grantHint: "Startguthaben. Ein Tipp kostet 1. Im Daily zählt eine geholfen Marke nicht.",
};

export const STRINGS: Record<Locale, Messages> = { es, en, fr, de };
