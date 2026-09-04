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
  shopTitle: string;
  shopHint: string;
  shopOpen: string;
  packBest: string;
  packUnit: string;
  packSave: string;
  pay: string;
  paySoon: string;
  paySoonBody: string;
  paySimulated: string;
  payAdded: string;
  shopNeedAccount: string;
  gatewayTitle: string;
  handleTitle: string;
  handleBody: string;
  handleHint: string;
  handleSave: string;
  handleTaken: string;
  handleInvalid: string;
  handleReserved: string;
  handleTry: string;
  handleOk: string;
  handleYours: string;
  handleChecking: string;
  handleCurrent: string;
  handleChange: string;
  handleChangeHint: string;
  handleContinue: string;
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
  loginBody: "Juega sin cuenta. Para subir tu marca eliges un nombre único. El de Google no se publica.",
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
  helpedHint: "El Tip ilumina el cambio de muro que hace un Mira, no la cruz más gorda. En Diario esa marca no se publica.",
  grantHint: "Saldo de prueba al empezar. El Tip cuesta 1. En Diario, con ayuda no se publica.",
  shopTitle: "Recargar",
  shopHint: "Un Tip cuesta 1. Halo es cinco veces Pulso por tres veces el precio.",
  shopOpen: "Recargar",
  packBest: "El que compensa",
  packUnit: "/ crédito",
  packSave: "−{n}%",
  pay: "Pagar {price}",
  paySoon: "El cobro llega pronto",
  paySoonBody: "La pasarela está lista. Aún no se cobra. No se ha cargado nada.",
  paySimulated: "Pago simulado",
  payAdded: "+{n} créditos",
  shopNeedAccount: "Entra con tu cuenta para recargar.",
  gatewayTitle: "Pasarela",
  handleTitle: "Tu nombre en Mira",
  handleBody: "Así te verán en el ranking. El nombre de Google se queda en privado.",
  handleHint: "3–16 caracteres. Empieza por letra. Letras, números, _ y -.",
  handleSave: "Guardar",
  handleTaken: "Ese nombre ya está en uso.",
  handleInvalid: "Ese nombre no vale.",
  handleReserved: "Ese nombre está reservado.",
  handleTry: "Prueba con uno de estos",
  handleOk: "Disponible.",
  handleYours: "Es el tuyo.",
  handleChecking: "Comprobando…",
  handleCurrent: "Nombre de usuario",
  handleChange: "Cambiar nombre",
  handleChangeHint: "Único en Mira. El ranking se actualiza al guardar.",
  handleContinue: "Continuar",
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
  loginBody: "Play without an account. To post your mark you pick a unique name. Your Google name stays private.",
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
  helpedHint: "A Tip lights the wall change that makes a Mira, not the fattest cross. On Daily that mark is not published.",
  grantHint: "Starter balance. A Tip costs 1. On Daily, a helped mark is not published.",
  shopTitle: "Top up",
  shopHint: "A Tip costs 1. Halo is five times Pulso for three times the price.",
  shopOpen: "Top up",
  packBest: "Best value",
  packUnit: "/ credit",
  packSave: "−{n}%",
  pay: "Pay {price}",
  paySoon: "Charging comes later",
  paySoonBody: "The checkout is ready. Nothing is charged yet. No payment was taken.",
  paySimulated: "Simulated payment",
  payAdded: "+{n} credits",
  shopNeedAccount: "Sign in to top up.",
  gatewayTitle: "Checkout",
  handleTitle: "Your name on Mira",
  handleBody: "This is how you’ll appear on the ranking. Your Google name stays private.",
  handleHint: "3–16 characters. Start with a letter. Letters, numbers, _ and -.",
  handleSave: "Save",
  handleTaken: "That name is taken.",
  handleInvalid: "That name isn’t valid.",
  handleReserved: "That name is reserved.",
  handleTry: "Try one of these",
  handleOk: "Available.",
  handleYours: "That’s yours.",
  handleChecking: "Checking…",
  handleCurrent: "Username",
  handleChange: "Change name",
  handleChangeHint: "Unique on Mira. The ranking updates when you save.",
  handleContinue: "Continue",
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
  loginBody: "Joue sans compte. Pour publier ta marque tu choisis un nom unique. On ne publie pas le nom Google.",
  pressure: "Pression",
  credits: "Crédits",
  tip: "Tip",
  tipNeed: "Sans crédits",
  tipDailyWarn: "Avec aide. Cette marque n’entre pas au classement.",
  helpedMark: "Avec aide",
  helpedHint: "Le Tip éclaire le changement de mur qui fait un Mira, pas la croix la plus grosse. Au quotidien, cette marque n’est pas publiée.",
  grantHint: "Solde d’essai au départ. Un Tip coûte 1. Au quotidien, avec aide, pas de classement.",
  shopTitle: "Recharger",
  shopHint: "Un Tip coûte 1. Halo, c’est cinq fois Pulso pour trois fois le prix.",
  shopOpen: "Recharger",
  packBest: "Le juste prix",
  packUnit: "/ crédit",
  packSave: "−{n}%",
  pay: "Payer {price}",
  paySoon: "Le paiement arrive",
  paySoonBody: "La passerelle est prête. Rien n’est débité pour l’instant.",
  paySimulated: "Paiement simulé",
  payAdded: "+{n} crédits",
  shopNeedAccount: "Entre avec ton compte pour recharger.",
  gatewayTitle: "Paiement",
  handleTitle: "Ton nom sur Mira",
  handleBody: "C’est ainsi que tu apparaîtras au classement. Le nom Google reste privé.",
  handleHint: "3–16 caractères. Commence par une lettre. Lettres, chiffres, _ et -.",
  handleSave: "Enregistrer",
  handleTaken: "Ce nom est déjà pris.",
  handleInvalid: "Ce nom n’est pas valable.",
  handleReserved: "Ce nom est réservé.",
  handleTry: "Essaie l’un de ceux-ci",
  handleOk: "Disponible.",
  handleYours: "C’est le tien.",
  handleChecking: "Vérification…",
  handleCurrent: "Nom d’utilisateur",
  handleChange: "Changer le nom",
  handleChangeHint: "Unique sur Mira. Le classement se met à jour en enregistrant.",
  handleContinue: "Continuer",
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
  loginBody: "Spiel ohne Konto. Für die Rangliste wählst du einen einzigartigen Namen. Dein Google-Name wird nicht veröffentlicht.",
  pressure: "Druck",
  credits: "Guthaben",
  tip: "Tipp",
  tipNeed: "Kein Guthaben",
  tipDailyWarn: "Mit Hilfe. Diese Marke kommt nicht in die Rangliste.",
  helpedMark: "Mit Hilfe",
  helpedHint: "Ein Tipp zeigt den Wandwechsel, der ein Mira ergibt, nicht das dickste Kreuz. Im Daily wird die Marke nicht veröffentlicht.",
  grantHint: "Startguthaben. Ein Tipp kostet 1. Im Daily zählt eine geholfen Marke nicht.",
  shopTitle: "Aufladen",
  shopHint: "Ein Tipp kostet 1. Halo ist fünfmal Pulso zum dreifachen Preis.",
  shopOpen: "Aufladen",
  packBest: "Der sich lohnt",
  packUnit: "/ Guthaben",
  packSave: "−{n}%",
  pay: "{price} zahlen",
  paySoon: "Zahlung kommt später",
  paySoonBody: "Die Kasse ist bereit. Es wird noch nichts abgebucht.",
  paySimulated: "Simulierte Zahlung",
  payAdded: "+{n} Guthaben",
  shopNeedAccount: "Melde dich an, um aufzuladen.",
  gatewayTitle: "Kasse",
  handleTitle: "Dein Name auf Mira",
  handleBody: "So erscheinst du in der Rangliste. Dein Google-Name bleibt privat.",
  handleHint: "3–16 Zeichen. Beginnt mit einem Buchstaben. Buchstaben, Zahlen, _ und -.",
  handleSave: "Speichern",
  handleTaken: "Dieser Name ist vergeben.",
  handleInvalid: "Dieser Name gilt nicht.",
  handleReserved: "Dieser Name ist reserviert.",
  handleTry: "Versuch einen davon",
  handleOk: "Frei.",
  handleYours: "Das ist deiner.",
  handleChecking: "Prüfen…",
  handleCurrent: "Benutzername",
  handleChange: "Namen ändern",
  handleChangeHint: "Einzigartig auf Mira. Die Rangliste aktualisiert sich beim Speichern.",
  handleContinue: "Weiter",
};

export const STRINGS: Record<Locale, Messages> = { es, en, fr, de };
