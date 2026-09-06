(function () {
  "use strict";

  const state = {
    page: 1,
    limit: 12,
    query: "",
    level: "",
    type: "",
    subject: ""
  };

  async function search() {
    const params = new URLSearchParams();

    params.set(
      "page",
      String(state.page)
    );

    params.set(
      "limit",
      String(state.limit)
    );

    if (state.query) {
      params.set("q", state.query);
    }

    if (state.level) {
      params.set("level", state.level);
    }

    if (state.type) {
      params.set("type", state.type);
    }

    if (state.subject) {
      params.set(
        "subject",
        state.subject
      );
    }

    try {
      const response =
        await fetch(
          `/api/resources?${params.toString()}`,
          {
            headers: {
              Accept: "application/json"
            }
          }
        );

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}`
        );
      }

      const data =
        await response.json();

      render(data);
    } catch (error) {
      console.error(
        "Library error:",
        error
      );

      render({
        resources: [],
        total: 0
      });
    }
  }

  function render(data) {
    const container =
      document.querySelector(
        "#resources"
      );

    if (!container) {
      return;
    }

    const resources =
      Array.isArray(data.resources)
        ? data.resources
        : [];

    if (!resources.length) {
      container.innerHTML = `
        <div class="empty-state">
          لا توجد موارد مطابقة حاليًا.
        </div>
      `;
      return;
    }

    container.innerHTML =
      resources
        .map((resource) => {
          const title =
            escapeHtml(
              resource.title ||
                "مورد رياضيات"
            );

          const description =
            escapeHtml(
              resource.description ||
                ""
            );

          return `
            <article class="resource">
              <span class="resource-type">
                ${escapeHtml(
                  resource.type || "RESOURCE"
                )}
              </span>

              <h3>${title}</h3>

              <p>${description}</p>

              <div class="resource-meta">
                ${
                  resource.level
                    ? `<span class="tag">${escapeHtml(
                        resource.level
                      )}</span>`
                    : ""
                }

                ${
                  resource.subject
                    ? `<span class="tag">${escapeHtml(
                        resource.subject
                      )}</span>`
                    : ""
                }
              </div>

              <div class="resource-actions">
                ${
                  resource.url
                    ? `
                    <a
                      class="btn btn-primary"
                      href="${escapeAttribute(
                        resource.url
                      )}"
                      target="_blank"
                      rel="noopener"
                    >
                      فتح
                    </a>
                  `
                    : ""
                }
              </div>
            </article>
          `;
        })
        .join("");
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value);
  }

  function init() {
    const searchInput =
      document.querySelector(
        "#librarySearch"
      );

    const level =
      document.querySelector(
        "#libraryLevel"
      );

    const type =
      document.querySelector(
        "#libraryType"
      );

    if (searchInput) {
      searchInput.addEventListener(
        "input",
        () => {
          state.query =
            searchInput.value.trim();

          state.page = 1;

          search();
        }
      );
    }

    if (level) {
      level.addEventListener(
        "change",
        () => {
          state.level =
            level.value;

          state.page = 1;

          search();
        }
      );
    }

    if (type) {
      type.addEventListener(
        "change",
        () => {
          state.type =
            type.value;

          state.page = 1;

          search();
        }
      );
    }
async function showResources(){


let data =
await loadResources();


let box =
document.getElementById("resources");


data.forEach(item=>{


box.innerHTML += `

<div class="resource">

<h3>
${item.title}
</h3>

<p>
${item.description || ""}
</p>


<a href="${item.file_url}">
فتح الملف
</a>


</div>

`;


});


}
    search();
  }

  window.HAMOU_LIBRARY = {
    search,
    state
  };

  document.addEventListener(
    "DOMContentLoaded",
    init
  );
})();
