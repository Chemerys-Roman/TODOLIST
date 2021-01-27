const taskArea = document.getElementById("task-list");
const addTaskForm = document.getElementById("newTask");
const addTaskInput = document.getElementById("add-task-input");
const undoForm = document.getElementById("undo-form");
const showComplitedInput = document.getElementById("show-completed-input");

document.addEventListener("submit", handleEvent);
document.addEventListener("change", handleEvent);
document.addEventListener("click", handleDeleteEvent);


function id() {
  let newId = Date.now();
  newId = newId.toString(16);
  return newId;
}

function taskToHtml(content) {

  let { id, task, completed } = content;
  return `<div id="todo-${id}" class="task" ><lable class="task__item task__item_span">${task}</lable> <input id="input-${id}" data-id="${id}" ${completed ? 'checked' : ''} class="task__item task__item_input" type="checkbox"> <a type="submit" id="button-${id}" class="task__item_link" ><img data-id="${id}" class="delete-task-img" src="/i/icons8-удалить-навсегда-48.png" ></a></div>`;

};

function renderTasks(state) {
  const { tasks, showComplited } = state;
  showComplited ? showComplitedInput.setAttribute("checked", "checked") : showComplitedInput.removeAttribute("checked", "checked");
  if (tasks) {
    taskArea.innerHTML = showComplited ? tasks.map(task => taskToHtml(task)).join("") : tasks.filter(task => task.completed !== true).map(task => taskToHtml(task)).join("")
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


class Store {
  constructor(dispatcher) {
    this.renderList = [];
    this.state = this.initialiseState();
    dispatcher.register(this.actionAdministrator.bind(this))
  };
  renderRegister(renderFunction) {
    this.renderList.push(renderFunction);
  }
  getState() {
    return this.state;
  };
  actionAdministrator(state, action) {
    throw ("actionAdministrator must be predeterminate");
  };
  initialiseState() {
    throw ("initialiseState must be predeterminate")
  }
  emitChange() {
    this.renderList.map(render => render(this.state));
  }
}


const d = new Dispatcher();


class TodoListStore extends Store {
  constructor() {
    super(d);
    this.history = [];
  };
  initialiseState() {
    let initState = localStorage.myTasks ? JSON.parse(localStorage.myTasks) : {
      tasks: [],
      showComplited: true,
    };
    return initState;
  }
  revertHistory() {
  }
  getHistory() {
    return this.history;
  }
  actionAdministrator(action) {
    const { type, payload } = action;
    const newState = { ...this.state, tasks: [...this.state.tasks] };
    this.history.push(newState);
    switch (type) {
      case "ADD_TASK":
        {
          this.state.tasks.push({ id: id(), task: payload, completed: false });
          this.emitChange();

        }
        break;
      case "SHOW_COMPLITED":
        {
          this.state.showComplited = payload;
          this.emitChange();
        }
        break;
      case "COMPLETE_TASK":
        {
          const { id, complete } = payload;
          this.state.tasks.map(task => { if (task.id === id) task.completed = complete });
          this.emitChange();
        }
        break;
      case "UNDO_LAST_CHANGES":
        {
          if (this.history.length > 1) {
            this.history.pop();
            const lastState = { ...this.history.pop() };
            this.state = { ...lastState, tasks: [...lastState.tasks] };
            this.emitChange();

          }
          else {
            alert("there is nothing to undo")
          }

        }
        break;
      case "DELETE_TASK": {

        this.state.tasks = this.state.tasks.filter(task => task.id !== payload);
        this.emitChange();
      };
        break;
    }
    localStorage.setItem("myTasks", JSON.stringify(this.state));

  }
};

function handleEvent(event) {
  event.preventDefault();
  let generatedAction;
  const { type, target } = event;
  if (target.classList.contains("task__item_input")) {
    generatedAction = {
      type: "COMPLETE_TASK",
      payload: { id: target.dataset.id, complete: target.checked }
    }
    d.dispatch(generatedAction);
  };
  switch (target) {
    case addTaskForm:
      {
        if (addTaskInput.value) {
          generatedAction = {
            type: "ADD_TASK",
            payload: addTaskInput.value,
          }
          addTaskInput.value = "";
          d.dispatch(generatedAction);

        }
        else
          alert("enter task discription");
      }
      break;
    case showComplitedInput: {
      generatedAction = {
        type: "SHOW_COMPLITED",
        payload: target.checked,
      }
      d.dispatch(generatedAction);
    }
      break;
    case undoForm: {
      generatedAction = {
        type: "UNDO_LAST_CHANGES",
        payload: ""
      }
      d.dispatch(generatedAction);
    }
      break;
  }

};
function handleDeleteEvent(event) {
  const { target } = event;
  let generatedAction;
  if (target.classList.contains("delete-task-img")) {
    generatedAction = {
      type: "DELETE_TASK",
      payload: target.dataset.id,
    };
    d.dispatch(generatedAction);
  }
}

const s = new TodoListStore(d);
s.renderRegister(renderTasks);
s.emitChange();