// ==========================================
// HORLOGE DÉCIMALE MULTI-VILLES
// ==========================================

// Éléments DOM
const systemComparisonElement = document.querySelector('#system-comparison .comparison-content');

// Variables globales
let animationFrameId;
let isPaused = false;
let clockCounter = 0; // Compteur pour IDs si nécessaire



// ==========================================
// FONCTIONS DE CALCUL DES TEMPS

// Fonction pour convertir le temps standard en temps décimal
function convertToDecimalTime(date) {
	// Utilise les millisecondes pour une précision élevée
	const msSinceMidnight = date.getHours() * 3600000 + date.getMinutes() * 60000 + date.getSeconds() * 1000 + date.getMilliseconds();
	const msInDay = 24 * 60 * 60 * 1000; // 86400000 ms

	const dayFraction = msSinceMidnight / msInDay;

	// Total en secondes décimales (100000 par jour). Peut être fractionnaire.
	const totalDecimalSeconds = dayFraction * 100000;

	const decimalHours = Math.floor(totalDecimalSeconds / 10000); // 10,000 s décimales / heure
	const remainingAfterHours = totalDecimalSeconds % 10000;

	const decimalMinutes = Math.floor(remainingAfterHours / 100); // 100 s décimales / minute
	const decimalSeconds = remainingAfterHours % 100; // peut être fractionnaire

	return {
		hours: decimalHours,
		minutes: decimalMinutes,
		seconds: decimalSeconds, // fractionnaire pour smooth
		totalFraction: dayFraction,
		totalDecimalSeconds: totalDecimalSeconds
	};
}

// Fonction pour obtenir l'heure dans un fuseau horaire spécifique
function getTimeInTimezone(timezone) {
	try {
		const now = new Date();
		const options = {
			timeZone: timezone,
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hour12: false
		};
		
		const formatter = new Intl.DateTimeFormat('en-GB', options);
		const parts = formatter.formatToParts(now);
		
		const year = parseInt(parts.find(part => part.type === 'year').value);
		const month = parseInt(parts.find(part => part.type === 'month').value) - 1;
		const day = parseInt(parts.find(part => part.type === 'day').value);
		const hour = parseInt(parts.find(part => part.type === 'hour').value);
		const minute = parseInt(parts.find(part => part.type === 'minute').value);
		const second = parseInt(parts.find(part => part.type === 'second').value);
		
		return new Date(year, month, day, hour, minute, second);
	} catch (error) {
		console.error('Erreur de fuseau horaire:', error);
		return new Date(); // Retourner l'heure locale en cas d'erreur
	}
}

// Fonction pour obtenir le fuseau horaire d'une ville
// Multi-city timezone lookup removed — only local timezone is used now.

// Fonction pour formater l'affichage numérique
function formatDigitalTime(isDecimal, hours, minutes, seconds) {
	if (isDecimal) {
		return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
	} else {
		return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
	}
}

// Fonction pour formater la date
function formatDate(date) {
	const options = {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	};
	return date.toLocaleDateString('fr-FR', options);
}

// ==========================================
// GESTION DES HORLOGES ANALOGIQUES
// ==========================================

// Fonction pour mettre à jour les aiguilles d'une horloge
function updateClockHands(clockId, hours, minutes, seconds, maxHours = 12) {
	const hourHand = document.getElementById(`${clockId}-hour-hand`);
	const minuteHand = document.getElementById(`${clockId}-minute-hand`);
	const secondHand = document.getElementById(`${clockId}-second-hand`);
	
	if (!hourHand || !minuteHand || !secondHand) return;
	
	let hourAngle, minuteAngle, secondAngle;
	
	if (maxHours === 10) {
		// Horloge décimale : 10h, 100min/h, 100s/min
		// seconds may be fractional for smooth movement
		hourAngle = ((hours % 10) + (minutes / 100) + (seconds / 10000)) * 36; // include fractional part
		minuteAngle = (minutes + (seconds / 100)) * 3.6; // seconds can be fractional
		secondAngle = seconds * 3.6; // 360° / 100s = 3.6°
	} else {
		// Horloge standard : 12h, 60min/h, 60s/min
		hourAngle = ((hours % 12) + (minutes / 60) + (seconds / 3600)) * 30; // include fractional part
		minuteAngle = (minutes + (seconds / 60)) * 6; // seconds can be fractional
		secondAngle = seconds * 6; // 360° / 60s = 6°
	}
	
	// Application des rotations
	hourHand.style.transform = `rotate(${hourAngle}deg)`;
	minuteHand.style.transform = `rotate(${minuteAngle}deg)`;
	secondHand.style.transform = `rotate(${secondAngle}deg)`;
}

// Fonction pour créer les numéros sur le cadran
function createClockNumbers(clockFace, isDecimal) {
	const maxNumber = isDecimal ? 10 : 12;
	
	for (let i = 1; i <= maxNumber; i++) {
		const number = document.createElement('div');
		number.className = 'clock-number';
		
		// Pour l'horloge décimale : 0,1,2,3,4,5,6,7,8,9
		// Pour l'horloge standard : 12,1,2,3,4,5,6,7,8,9,10,11
		if (isDecimal) {
			number.textContent = i === maxNumber ? '0' : i;
		} else {
			number.textContent = i === maxNumber ? '12' : i;
		}
		
		// Calcul de la position (en cercle)
		// Pour décimal: commence par 0 en haut, puis 1, 2, 3...
		// Pour standard: commence par 12 en haut, puis 1, 2, 3...
		const angle = (i * (360 / maxNumber)) - 90; // -90 pour commencer en haut
		const radius = 42; // Distance du centre (ajustée)
		
		// Calcul des coordonnées polaires vers cartésiennes
		const radian = (angle * Math.PI) / 180;
		const x = Math.cos(radian) * radius + 50; // 50% = centre du cadran
		const y = Math.sin(radian) * radius + 50;
		
		// Positionnement avec centrage du texte
		number.style.left = `calc(${x}% - 8px)`;
		number.style.top = `calc(${y}% - 8px)`;
		
		clockFace.appendChild(number);
	}
}

// ==========================================
// GESTION DES CARTES D'HORLOGES DE VILLE
// ==========================================

// Fonction pour créer une carte d'horloge de ville
// Multi-city clock creation removed — application displays only the user's local clock.

// Fonction pour supprimer une carte d'horloge de ville
// removeCityClockCard removed — no multi-city management

// Fonction pour ajouter une ville
// addCity removed — UI for adding cities has been removed

// ==========================================
// FONCTION DE MISE À JOUR PRINCIPALE
// ==========================================

function updateAllClocks() {
	if (isPaused) return;
	
	// Mettre à jour l'horloge locale
	const now = new Date();
	const decimalTime = convertToDecimalTime(now);
	
	// Affichages numériques locaux
	const localDecimalDigital = document.getElementById('local-decimal-digital');
	const localStandardDigital = document.getElementById('local-standard-digital');
	
	if (localDecimalDigital) {
		// Affichage numérique : tronquer les secondes comme dans l'exemple donné
		const dispSeconds = Math.floor(decimalTime.seconds);
		localDecimalDigital.textContent = formatDigitalTime(true, decimalTime.hours, decimalTime.minutes, dispSeconds);
	}
	if (localStandardDigital) {
		localStandardDigital.textContent = formatDigitalTime(false, now.getHours(), now.getMinutes(), now.getSeconds());
	}
	
	// Horloges analogiques locales
	// Pour les aiguilles, on passe la valeur fractionnaire des secondes pour un mouvement fluide
	updateClockHands('local-decimal', decimalTime.hours, decimalTime.minutes, decimalTime.seconds, 10);
	updateClockHands('local-standard', now.getHours(), now.getMinutes(), now.getSeconds(), 12);
	
	// Mettre à jour la date
	const dateElement = document.getElementById('date-display');
	if (dateElement) {
		dateElement.textContent = formatDate(now);
	}
	
	// Multi-city updates removed — only local clock is updated above
}

// ==========================================
// FONCTIONS D'ANIMATION
// ==========================================

function startAnimation() {
	function animate() {
		updateAllClocks();
		if (!isPaused) {
			animationFrameId = requestAnimationFrame(animate);
		}
	}
	animate();
}

function togglePause() {
	isPaused = !isPaused;
	pauseResumeButton.textContent = isPaused ? 'Reprendre' : 'Pause';
	
	if (!isPaused) {
		startAnimation();
	}
}

// (Gestion des thèmes supprimée — Neumorphism appliqué statiquement)

// ==========================================
// INITIALISATION
// ==========================================

function initializeApp() {
	// Initialiser les marqueurs sur les cadrans locaux
	initializeLocalClockMarkers();
	
	// Détecter le fuseau horaire local et afficher la localisation
	const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local';
	const localCityName = userTimezone.split('/').pop().replace(/_/g, ' ');
	updateLocalClockLocation(`Local (${localCityName})`);

	// Démarrer l'animation
	startAnimation();
}

// Fonction pour initialiser les marqueurs sur les cadrans locaux
function initializeLocalClockMarkers() {
	// Marqueurs pour l'horloge décimale locale
	const decimalFace = document.querySelector('#local-clock-section .decimal-clock .clock-face');
	if (decimalFace) {
		createClockNumbers(decimalFace, true);
	}
	
	// Marqueurs pour l'horloge standard locale
	const standardFace = document.querySelector('#local-clock-section .standard-clock .clock-face');
	if (standardFace) {
		createClockNumbers(standardFace, false);
	}
}

// Fonction pour mettre à jour l'affichage de la localisation
function updateLocalClockLocation(locationName) {
	const locationElement = document.getElementById('local-location');
	if (locationElement) {
		locationElement.textContent = locationName;
	}
}

// Global city removal no longer applicable

// Démarrer l'application une fois le DOM chargé
document.addEventListener('DOMContentLoaded', initializeApp);
