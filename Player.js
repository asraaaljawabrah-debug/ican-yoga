
// Hämta element från HTML-sidan
const title = document.getElementById("exercise-title");
const category = document.getElementById("exercise-category");
const duration = document.getElementById("exercise-duration");
const description = document.getElementById("exercise-description");
const video = document.getElementById("exercise-video");
const downloadButton = document.getElementById("download-button");
const backButton = document.getElementById("back-button");

// Information om övningarna
const exercises = {
    1: {
        title: "Styrkeandning",
        category: "Korta övningar",
        duration: "2 minuter",
        description: "Andning kombinerad med mjuka handrörelser."
    },
    2: {
        title: "Ankra i kroppen",
        category: "Korta övningar",
        duration: "2–3 minuter",
        description: "En övning för att känna dig lugn och trygg."
    },
    3: {
        title: "Grounding: Landa i nuet",
        category: "Korta övningar",
        duration: "5 minuter",
        description: "En mjuk övning för att bli mer medveten om din kropp."
    },
    4: {
        title: "Fysiologisk suck: Längre utandning",
        category: "Korta övningar",
        duration: "5–7 minuter",
        description: "En andningsövning med längre utandning."
    },
    5: {
        title: "Sammanhängande andning: Lugn rytm",
        category: "Korta övningar",
        duration: "5–7 minuter",
        description: "Långsam andning i en lugn och jämn rytm."
    },
    6: {
        title: "Ansikte, käke, nacke och axlar",
        category: "Korta övningar",
        duration: "5 minuter",
        description: "Mjuk avslappning för ansikte, nacke och axlar."
    },
    7: {
        title: "Vila med barnet nära",
        category: "Korta övningar",
        duration: "6–8 minuter",
        description: "En avslappnande övning med ditt barn nära dig."
    },
    8: {
        title: "Stresslindring: Släpp trycket",
        category: "Längre pass",
        duration: "10–15 minuter",
        description: "Mjuka rörelser som hjälper dig att släppa stress och spänningar."
    },
    9: {
        title: "Öka cirkulationen",
        category: "Längre pass",
        duration: "10–15 minuter",
        description: "Mjuka rörelser för att förbättra blodcirkulationen."
    },
    10: {
        title: "Vilopaus under dagen",
        category: "Längre pass",
        duration: "12–15 minuter",
        description: "En avkopplande paus under dagen."
    },
    11: {
        title: "Avslappning inför sömn",
        category: "Längre pass",
        duration: "20 minuter",
        description: "En guidad avslappning inför läggdags."
    }
};

// Tillfällig testvideo
const testVideo = "test-video.mp4";

// Hämta valt övnings-ID från webbadressen
const params = new URLSearchParams(window.location.search);
const exerciseId = params.get("id");

// Hitta vald övning
const selectedExercise = exercises[exerciseId];

// Visa information om övningen
if (selectedExercise) {
    title.textContent = selectedExercise.title;
    category.textContent = selectedExercise.category.toUpperCase();
    duration.textContent = selectedExercise.duration;
    description.textContent = selectedExercise.description;

    video.querySelector("source").src = testVideo;
    video.load();
} else {
    title.textContent = "Övningen hittades inte";
    description.textContent = "Gå tillbaka till listan med övningar.";
}

// Knapp för att ladda ner videon
downloadButton.addEventListener("click", function () {
    const link = document.createElement("a");
    link.href = testVideo;
    link.download = "test-video.mp4";
    link.click();
});

// Knapp för att gå tillbaka
backButton.addEventListener("click", function () {
    window.location.href = "index.html#exercises";
});
