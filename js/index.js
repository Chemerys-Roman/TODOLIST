const taskArea = document.getElementById("task-list");
const addTaskForm = document.getElementById("newTask");
const addTaskInput = document.getElementById("add-task-input");
const addTaskButton = document.getElementById("add-task-button");
const undoForm = document.getElementById("undo-form");
const showComplitedInput = document.getElementById("show-completed-input");

console.log();


function id() {
  let newId = Date.now();
  newId = newId.toString(16);
  return newId;
}

function taskToHtml(content) {

  let { id, task, completed } = content;
  return `<div id="todo-${id}" class="task" >
            <lable data-id="${id}"  class="task__item task__item_span">${task}</lable> 
            <div class="task__item task__item_input-container"> <input id="input-${id}" data-id="${id}" ${completed ? 'checked' : ''}   class="task__item task__item_input" name="taskInput" type="checkbox"> 
            </div>
            <form data-id="${id}" name="deleteButton" class="task__item_link-container">
            <button type="submit" id="button-${id}" data-id="${id}" class="task__item_link" > 
            </button>
            </form>
          </div>`;

};


function renderTasks({ tasks, showComplited }) {
  showComplited ?
    showComplitedInput.setAttribute("checked", "checked")
    : showComplitedInput.removeAttribute("checked", "checked");
  if (tasks) {
    taskArea.innerHTML = showComplited ?
      tasks.map(task => taskToHtml(task)).join("")
      : tasks.filter(task => task.completed !== true).map(task => taskToHtml(task)).join("");
  }
};

class Dispatcher {
  constructor() {
    this.eventHandlerList = [];
  }
  register(handler) {
    this.eventHandlerList.push(handler)
  }
  dispatch(action) {
    this.eventHandlerList.map(handler => handler(action));
  }
}

const dispatcher = new Dispatcher();
document.addEventListener("submit", (event) => { let action = handleEvent(event); action ? dispatcher.dispatch(action) : console.log(action); });
document.addEventListener("change", (event) => { let action = handleEvent(event); action ? dispatcher.dispatch(action) : console.log(action); });
document.addEventListener("dblclick", (event) => { let action = handleEventDbclick(event); action ? dispatcher.dispatch(action) : console.log(action); });


class TodoListStore {
  constructor(dispatcher) {
    this.renderList = [];
    this.state = this.initialiseState();
    dispatcher.register(this.actionAdministrator.bind(this))
    this.history = [];
  };
  renderRegister(renderFunction) {
    this.renderList.push(renderFunction);
  }
  getState() {
    return this.state;
  };
  initialiseState() {
    let initState = localStorage.myTasks ? JSON.parse(localStorage.myTasks) : {
      tasks: [],
      showComplited: true,
    };
    return initState;
  }

  getHistory() {
    return this.history;
  }
  emitChange() {
    this.renderList.map(render => render(this.state));
  }

  actionAdministrator(action) {
    console.log(action);
    const { type, payload } = action;
    const newState = JSON.parse(JSON.stringify(this.state));
    this.history.push(newState);
    const methods = [
      ["ADD_TASK",
        function () {
          this.state.tasks.push({ id: id(), task: payload, completed: false });
          addTaskInput.value = "";
          this.emitChange();
        }],

      ["SHOW_COMPLITED",
        function () {
          this.state.showComplited = payload;
          this.emitChange();
        }],
      ["COMPLETE_TASK",
        function () {
          const { id, complete } = payload;
          this.state.tasks.map(task => { if (task.id === id) task.completed = complete });
          this.emitChange();
        }],

      ["UNDO_LAST_CHANGES", function () {
        if (this.history.length > 1) {
          this.history.pop();
          const lastState = { ...this.history.pop() };
          this.state = { ...lastState, tasks: [...lastState.tasks] };
          this.emitChange();

        }
        else {
          alert("there is nothing to undo");

        }

      }],

      ["DELETE_TASK", function () {

        this.state.tasks = this.state.tasks.filter(task => task.id !== payload);
        this.emitChange();
      }],

      ["CHANGE_TASK",
        function () {
          console.log(this.history);
          this.state.tasks.find(task => task.id === payload.id).task = payload.value;
          this.emitChange();
          console.log(this.state);
        }
      ],
    ]
    const actionMethods = new Map(methods);
    actionMethods.get(type).call(this);
    actionMethods.type
    localStorage.setItem("myTasks", JSON.stringify(this.state));

  }
};


function handleEvent(event) {
  event.preventDefault();
  const { type, target } = event;
  const reg = /^\s+$/g;
  console.log(addTaskForm.elements.newTaskValue.value);
  if (type === "change" && target === addTaskInput) return;
  else
    if (type === "submit" && target === addTaskForm && (!target.elements.newTaskValue.value || reg.test(target.elements.newTaskValue.value))) { alert("please, enter some text!!!"); return; }
    else {
      const actionList = [
        ["deleteButton", function () {
          return {
            type: "DELETE_TASK",
            payload: target.dataset.id,
          }
        }
        ],
        [addTaskForm, function () {
          return {
            type: "ADD_TASK",
            payload: addTaskForm.elements.newTaskValue.value,
          }

        }
        ],
        [undoForm, function () {
          return {
            type: "UNDO_LAST_CHANGES",
            payload: ""
          }
        }
        ],
        ["taskInput", function () {
          return {
            type: "COMPLETE_TASK",
            payload: { id: target.dataset.id, complete: target.checked }
          }
        }
        ],
        [showComplitedInput, function () {
          return {
            type: "SHOW_COMPLITED",
            payload: target.checked,
          }
        }

        ],

      ];
      const getAction = new Map(actionList);
      console.log(getAction.get(target), getAction.get(target.name));
      return (getAction.get(target) ? getAction.get(target).call(this) : getAction.get(target.name).call())
    }
}
function handleEventDbclick(event) {
  const { target } = event;
  if (target.classList.contains("task__item_span")) {
    const changeInput = document.createElement("input");
    changeInput.classList.add("task__item_span-change");
    changeInput.dataset.id = target.dataset.id;
    changeInput.setAttribute("type", "text");
    changeInput.value = target.innerText;
    target.appendChild(changeInput);
    changeInput.focus();
    changeInput.addEventListener("keydown", handleKeyEnter);
    changeInput.addEventListener("blur", (event) => { let action = handleBlur(event); action ? dispatcher.dispatch(action) : console.log(action); });



  }

};
function handleKeyEnter({ type, target, keyCode }) {
  if (type === "keydown" && keyCode === 13) {

    target.blur();
  }

}
function handleBlur(event) {
  event.preventDefault();
  const { type, target } = event;

  console.log(target);
  let changAction;
  if (target.classList.contains("task__item_span-change")) {
    changAction = {
      type: "CHANGE_TASK",
      payload: { id: target.dataset.id, value: target.value, },
    };
    target.remove();
  }
  return changAction;

}





const store = new TodoListStore(dispatcher);
store.renderRegister(renderTasks);
store.emitChange();