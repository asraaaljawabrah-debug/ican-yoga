const exercises = [
    {
        id: 1,
        name: "Styrkeandning",
        category: "Short Exercises",
        duration: "2 min",
        description: "Breathing combined with gentle hand movements."
    },
    {
        id: 2,
        name: "Ankra i kroppen",
        category: "Short Exercises",
        duration: "2–3 min",
        description: "A grounding exercise to feel calm and safe."
    },
    {
        id: 3,
        name: "Grounding: Landa i nuet",
        category: "Short Exercises",
        duration: "5 min",
        description: "A gentle exercise to become aware of your body."
    },
    {
        id: 4,
        name: "Fysiologisk suck: Längre utandning",
        category: "Short Exercises",
        duration: "5–7 min",
        description: "A breathing exercise with a longer exhalation."
    },
    {
        id: 5,
        name: "Coherent Breath: Lugn rytm",
        category: "Short Exercises",
        duration: "5–7 min",
        description: "Slow and rhythmic breathing."
    },
    {
        id: 6,
        name: "Ansikte, käke, nacke och axlar",
        category: "Short Exercises",
        duration: "5 min",
        description: "Gentle relaxation for the face, neck and shoulders."
    },
    {
        id: 7,
        name: "Vila med barnet nära",
        category: "Short Exercises",
        duration: "6–8 min",
        description: "A relaxing exercise with your baby close to you."
    },
    {
        id: 8,
        name: "Stress Release: Släpp trycket",
        category: "Longer Sessions",
        duration: "10–15 min",
        description: "Gentle movements to release stress and tension."
    },
    {
        id: 9,
        name: "Öka cirkulationen",
        category: "Longer Sessions",
        duration: "10–15 min",
        description: "Gentle movements to improve circulation."
    },
    {
        id: 10,
        name: "Vilopaus under dagen",
        category: "Longer Sessions",
        duration: "12–15 min",
        description: "A relaxing break during the day."
    },
    {
        id: 11,
        name: "Avslappning inför sömn",
        category: "Longer Sessions",
        duration: "20 min",
        description: "A guided relaxation before bedtime."
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

        if (exercise.category === "Short Exercises") {
            shortContainer.appendChild(card);
        } else {
            longContainer.appendChild(card);
        }
    });
}

// Prepare selected exercise for the video player
function selectExercise(id) {
    const exercise = exercises.find(function(item) {
        return item.id === id;
    });

    if (!exercise) {
        console.error("Exercise not found");
        return;
    }

    alert("Selected exercise: " + exercise.name +
          "\nThe video player will be connected later.");
}

// Show exercises when the page loads
document.addEventListener("DOMContentLoaded", renderExercises);