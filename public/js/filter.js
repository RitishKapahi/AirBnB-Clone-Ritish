"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const containerSelectors = [
        "[data-category-scroll]",
        ".category-scroll",
        ".filter-scroll",
        ".category-filters",
        ".filter-list",
        ".filters",
        ".filter-bar",
        "#filter-container",
    ];

    const findScrollContainer = (button) => {
        const targetId =
            button.dataset.scrollTarget ||
            button.getAttribute("aria-controls");

        if (targetId) {
            const target = document.getElementById(
                targetId.replace(/^#/, "")
            );

            if (target) {
                return target;
            }
        }

        let parent = button.parentElement;

        for (let level = 0; parent && level < 4; level++) {
            for (const selector of containerSelectors) {
                const target = parent.querySelector(selector);

                if (target && target !== button) {
                    return target;
                }
            }

            parent = parent.parentElement;
        }

        const candidates = document.querySelectorAll(
            containerSelectors.join(",")
        );

        return Array.from(candidates).find(
            (element) =>
                element.scrollWidth > element.clientWidth + 2
        ) || null;
    };

    const scrollButtons = document.querySelectorAll(
        ".category-arrow, #slideButton"
    );

    scrollButtons.forEach((button, index) => {
        const container = findScrollContainer(button);

        if (!container) {
            return;
        }

        const direction = () => {
            const explicitDirection = button.dataset.direction;

            if (explicitDirection === "left" || explicitDirection === "-1") {
                return -1;
            }

            if (explicitDirection === "right" || explicitDirection === "1") {
                return 1;
            }

            if (
                button.classList.contains("left") ||
                button.classList.contains("prev") ||
                button.classList.contains("previous")
            ) {
                return -1;
            }

            if (
                button.classList.contains("right") ||
                button.classList.contains("next")
            ) {
                return 1;
            }

            return index === 0 ? -1 : 1;
        };

        const updateArrows = () => {
            const maxScroll = container.scrollWidth - container.clientWidth;
            const currentScroll = container.scrollLeft;
            const scrollDirection = direction();

            button.disabled =
                scrollDirection < 0
                    ? currentScroll <= 2
                    : currentScroll >= maxScroll - 2;

            button.setAttribute("aria-disabled", String(button.disabled));

            button.classList.toggle("disabled", button.disabled);

            if (maxScroll <= 2) {
                button.hidden = true;
            } else {
                button.hidden = false;
            }
        };

        button.addEventListener("click", (event) => {
            event.preventDefault();

            container.scrollBy({
                left: direction() * Math.max(container.clientWidth * 0.7, 200),
                behavior: "smooth",
            });
        });

        container.addEventListener("scroll", updateArrows, {
            passive: true,
        });

        window.addEventListener("resize", updateArrows);

        updateArrows();
    });

    // Keep category links working as normal navigation links.
    // The active category is determined from the current URL.
    const categoryLinks = document.querySelectorAll(
        'a[href*="/listings/filter/"], a[data-category-filter]'
    );

    let currentPath = window.location.pathname;

    try {
        currentPath = decodeURIComponent(currentPath);
    } catch {
        // Keep the original path if decoding fails.
    }

    categoryLinks.forEach((link) => {
        let linkPath;

        try {
            linkPath = new URL(link.href, window.location.origin).pathname;
            linkPath = decodeURIComponent(linkPath);
        } catch {
            return;
        }

        const isActive = linkPath === currentPath;

        link.classList.toggle("active", isActive);
        link.classList.toggle("selected", isActive);

        if (isActive) {
            link.setAttribute("aria-current", "page");
        } else {
            link.removeAttribute("aria-current");
        }
    });
});
