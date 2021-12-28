import * as fs from 'fs';

export enum TaskStatus {
    Done, Active
}

export interface Task {
    id: number;
    name: string;
    status: TaskStatus;
    due?: Date;
    completed?: Date;
    created: Date;
    tags: string[];
    subtasks: Task[];
    blockers: Blocker[];
}

export interface Blocker {
    id: number;
    description: string;
    status: TaskStatus;
    // due?: Date;
    // tags: string[];
}

export interface TaskUpdate {
    name?: string;
    status?: TaskStatus;
    due?: Date;
    tags?: string[];
}

export class TaskUtil {
    private readonly filepath = `${process.env.HOME}/.wrkflow/wrkflow.tasks`;
    private readonly directorypath = `${process.env.HOME}/.wrkflow/`;
    private tasks: Task[];

    public constructor() {
        if (!this.taskFileExists()) {
            this.writeEmptyTaskFile();
        }
        
        this.readTaskFile();
    }

    private readTaskFile(): void {
        const taskString = fs.readFileSync(this.filepath, {encoding: 'ascii'});
        const json = JSON.parse(taskString);
        this.tasks = json;
    }

    private writeTaskFile() {
        if (!fs.existsSync(this.directorypath)) {
            fs.mkdirSync(this.directorypath, { recursive: true });
        }
        fs.writeFileSync(this.filepath, JSON.stringify(this.tasks));
    }

    private writeEmptyTaskFile() {
        const tasks: Task[] = [];

        if (!fs.existsSync(this.directorypath)) {
            fs.mkdirSync(this.directorypath, { recursive: true });
        }
        fs.writeFileSync(this.filepath, JSON.stringify(tasks));
    }

    private taskFileExists(): boolean {
         return fs.existsSync(this.filepath);
    }

    // Public Modifiers //

    public addTask = (name: string, due: Date = undefined, tags: string[] = []) => {
        this.readTaskFile();
        const id = this.getNewUniqueId();

        const newTask: Task = {
            id,
            name,
            due,
            created: new Date(),
            status: TaskStatus.Active,
            tags: tags,
            subtasks: [],
            blockers: []
        }
        this.tasks.push(newTask);
        this.writeTaskFile();
    }
    
    public deleteTask = (id: number, tasks: any[] = this.tasks, write: boolean = true) => {
        this.readTaskFile();

        tasks = tasks.filter(task => task.id !== id);
        tasks.forEach((task: Task) => {
            if (task.subtasks) task.subtasks = this.deleteTask(id, task.subtasks, false);
            if (task.blockers) task.blockers = this.deleteTask(id, task.blockers, false);
        })

        this.tasks = tasks;
        this.writeTaskFile();
        
        return tasks;
    }

    public updateTask = (id: number, update: TaskUpdate) => {
        this.readTaskFile();

        let task = this.findTaskRecursively(this.tasks, id);
        if (update.status != undefined) task.status = update.status;
        if (update.name) task.name = update.name;
        if (update.due) task.due = update.due;
        if (update.tags) task.tags = update.tags;

        this.writeTaskFile();
    }

    public addSubtask = (id: number, name: string, due: Date = undefined, tags: string[] = []) => {
        this.readTaskFile();

        const task = this.findTaskRecursively(this.tasks, id);
        const subtaskId = this.getNewUniqueId();
        const subtask: Task = {
            id: subtaskId,
            name,
            due,
            created: new Date(),
            status: TaskStatus.Active,
            tags: tags,
            subtasks: [],
            blockers: []
        }

        task.subtasks.push(subtask);
        this.writeTaskFile();
    }

    public addBlocker = (id: number, description: string) => {
        this.readTaskFile();

        const task = this.findTaskRecursively(this.tasks, id);
        const subtaskId = this.getNewUniqueId();
        const subtask: Blocker = {
            id: subtaskId,
            description,
            status: TaskStatus.Active
        }

        task.blockers.push(subtask);
        this.writeTaskFile();
    }

    public getTasks = (): Task[] =>  {
        this.readTaskFile();
        return this.tasks;
    }

    // Helpers //

    private getAllIdsRecursively = (tasks: Task[]) => {
        let allIds: number[] = [];
        tasks.forEach(task => {
            allIds.push(task.id);
            allIds = [...allIds, ...this.getAllIdsRecursively(task.subtasks)];
            const blockerIds = task.blockers?.map(blocker => blocker.id) || [];
            allIds = [...allIds, ...blockerIds];
        });

        return allIds;
    }

    public findTaskRecursively = (tasks: any[], searchId: number): any => {
        let foundTask = undefined;
        for (let task of tasks) {
            if (task.id === searchId) {
                foundTask = task;
                break;
            }

            const newSearch = [...(task.subtasks || []), ...(task.blockers || [])];
            const foundRecursive = this.findTaskRecursively(newSearch, searchId);
            if (foundRecursive?.id === searchId) {
                foundTask = foundRecursive;
                break;
            };
        }

        return foundTask;
    }

    public findTaskRecursivelyByQuery = (tasks: any[], query: string): any[] => {
        let foundTasks = [];

        for (let task of tasks) {
            if (task.name?.toUpperCase().includes(query.toLocaleUpperCase())) {
                foundTasks.push(task);
            } else if (task.description?.toUpperCase().includes(query.toUpperCase())) {
                foundTasks.push(task);
            } else if (task.tags?.some((tag: string) => tag.toUpperCase().includes(query.toUpperCase()))) {
                foundTasks.push(task);
            } else {
                const newSearch = [...(task.subtasks || []), ...(task.blockers || [])];
                const foundRecursive = this.findTaskRecursivelyByQuery(newSearch, query);
                if (foundRecursive.length > 0) foundTasks.push(task);
            }
        }

        return foundTasks;
    }

    public findBlockedTasksRecursively = (tasks: any[]): any[] => {
        let foundTasks = [];

        for (let task of tasks) {
            const taskHasAnActiveBlocker = task.blockers?.some((blocker: Blocker) => blocker.status === TaskStatus.Active);
            if (taskHasAnActiveBlocker) {
                foundTasks.push(task);
            } else if (task.subtasks?.length > 0) {
                const foundRecursive = this.findBlockedTasksRecursively(task.subtasks);
                if (foundRecursive.length > 0) foundTasks.push(task);
            }
        }

        return foundTasks;
    }

    public isTaskBlocked = (task: Task): boolean => {
        let taskIsBlocked = false;
        
        const taskHasAnActiveBlocker = task.blockers?.some((blocker: Blocker) => blocker.status === TaskStatus.Active);
        if (taskHasAnActiveBlocker) {
            return true;
        } else if (task.subtasks?.length > 0) {
            return task.subtasks.some(subtask => this.isTaskBlocked(subtask));
        }

        return taskIsBlocked;
    }

    public findParentRecursively = (tasks: any[], searchId: number): any => {
        let foundTask = undefined;
        for (let task of tasks) {
            const foundRecursive = this.findTaskRecursively([...task.subtasks, ...task.blockers], searchId);
            if (foundRecursive?.id === searchId) {
                foundTask = task;
                break;
            };
        }

        return foundTask;
    }

    private getNewUniqueId = () => {
        const allExistingIds = this.getAllIdsRecursively(this.tasks);
        let newUniqueId = 0;
        while (allExistingIds.some(id => id === newUniqueId)) {
            newUniqueId ++;
        }

        return newUniqueId;
    }

    // public isTaskBlocked(task: Task): boolean => {
    //     task.status == TaskStatus.Active && task.blockers.length > 0;
        
    // }

}