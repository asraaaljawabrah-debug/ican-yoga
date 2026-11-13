const exercises = [
    {
        id: 1,
        name: "Styrkeandning",
        category: "Korta övningar",
        duration: "2 min",
        description: "Andning i kombination med mjuka handrörelser."
    },
    {
        id: 2,
        name: "Ankra i kroppen",
        category: "Korta övningar",
        duration: "2–3 min",
        description: "En grundande övning som hjälper dig att känna lugn och trygghet."
    },
    {
        id: 3,
        name: "Jordning: Landa i nuet",
        category: "Korta övningar",
        duration: "5 min",
        description: "En mjuk övning för att bli mer medveten om din kropp."
    },
    {
        id: 4,
        name: "Fysiologisk suck: Längre utandning",
        category: "Korta övningar",
        duration: "5–7 min",
        description: "En andningsövning med längre utandning."
    },
    {
        id: 5,
        name: "Sammanhängande andning: Lugn rytm",
        category: "Korta övningar",
        duration: "5–7 min",
        description: "Långsam andning i en lugn och jämn rytm."
    },
    {
        id: 6,
        name: "Ansikte, käke, nacke och axlar",
        category: "Korta övningar",
        duration: "5 min",
        description: "Mjuk avslappning för ansikte, käke, nacke och axlar."
    },
    {
        id: 7,
        name: "Vila med barnet nära",
        category: "Korta övningar",
        duration: "6–8 min",
        description: "En avslappnande övning med ditt barn nära dig."
    },
    {
        id: 8,
        name: "Stresslindring: Släpp trycket",
        category: "Längre pass",
        duration: "10–15 min",
        description: "Mjuka rörelser som hjälper dig att släppa stress och spänningar."
    },
    {
        id: 9,
        name: "Öka cirkulationen",
        category: "Längre pass",
        duration: "10–15 min",
        description: "Mjuka rörelser som hjälper till att öka blodcirkulationen."
    },
    {
        id: 10,
        name: "Vilopaus under dagen",
        category: "Längre pass",
        duration: "12–15 min",
        description: "En avkopplande paus under dagen."
    },
    {
        id: 11,
        name: "Avslappning inför sömn",
        category: "Längre pass",
        duration: "20 min",
        description: "En guidad avslappningsövning inför läggdags."
    }
];

// Create exercise cards
function renderExercises() {
    const shortContainer = document.getElementById("short-exercises");
    const longContainer = document.getElementById("long-exercises");

    if (!shortContainer || !longContainer) {
        console.error("Exercise containers not found.");
        return;
    }

    shortContainer.innerHTML = "";
    longContainer.innerHTML = "";

    const exerciseIcons = {
        1: "🌬️",
        2: "🌿",
        3: "🌱",
        4: "💨",
        5: "🫁",
        6: "🧘",
        7: "🤱",
        8: "🤸",
        9: "🌼",
        10: "☁️",
        11: "🌙"
    };

    exercises.forEach(function(exercise) {
        const card = document.createElement("button");
        card.type = "button";
        card.className = "exercise-card exercise-card-button";

        const icon = document.createElement("span");
        icon.className = "exercise-icon";
        icon.textContent = exerciseIcons[exercise.id];

        const info = document.createElement("span");
        info.className = "exercise-info";

        const title = document.createElement("span");
        title.className = "exercise-name";
        title.textContent = exercise.name;

        const duration = document.createElement("span");
        duration.className = "exercise-duration";
        duration.textContent = "⏱ " + exercise.duration;

        const description = document.createElement("span");
        description.className = "exercise-description";
        description.textContent = exercise.description;

        info.appendChild(title);
        info.appendChild(duration);
        info.appendChild(description);

        const arrow = document.createElement("span");
        arrow.className = "exercise-arrow";
        arrow.textContent = "›";

        card.appendChild(icon);
        card.appendChild(info);
        card.appendChild(arrow);

        card.addEventListener("click", function() {
            selectExercise(exercise.id);
        });

        if (exercise.category === "Korta övningar") {
            shortContainer.appendChild(card);
        } else {
            longContainer.appendChild(card);
        }
    });
}

// Open the video player for the selected exercise
function selectExercise(id) {
    const exercise = exercises.find(function(item) {
        return item.id === id;
    });

    if (!exercise) {
        console.error("Exercise not found");
        return;
    }

    window.location.href = "Player.html?id=" + id;
}

// Show exercises when the page loads
document.addEventListener("DOMContentLoaded", renderExercises);