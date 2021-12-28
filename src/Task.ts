import chalk from 'chalk';
import { Command, CommandUtil } from './Utilities/CommandUtil';
import { Task, TaskStatus, TaskUtil } from './Utilities/TaskUtil';
import { ConsoleUtil, Separator } from './Utilities/ConsoleUtil';
import { promises } from 'dns';

export default class Main {

    private taskUtil = new TaskUtil();

    public handleSystemArguments(systemArguments: string[]) {
        const args = systemArguments.slice(2);
        const secondaryArgs = systemArguments.slice(3);
        const command = CommandUtil.getClosestMatch(args[0], this.commands);

        if (args.includes(CommandUtil.helpFlag)) {
            CommandUtil.logCommandHelpString(command);
        } else {
            command.function(secondaryArgs, command);
        }
    }

    private add = (args: string[], command: Command) => {
        if (!CommandUtil.validateArguments(args, 1, 3)) {
            ConsoleUtil.logInvalidArgumentsError(command);
            return;
        }

        const taskName = args[0];
        const daysUntilDue = Number.parseInt(args[1]);
        const tags = this.getArrayFromCSV(args[2]) || [];

        const due: Date = new Date();
        due.setDate(due.getDate() + daysUntilDue);

        this.taskUtil.addTask(taskName, due, tags);
        this.logSuccess(`Successfully added task: '${taskName}'.`);
        this.list([], command);
    }

    private remove = (args: string[], command: Command) => {
        if (!CommandUtil.validateArguments(args, 1, 1)) {
            ConsoleUtil.logInvalidArgumentsError(command);
            return;
        }
        let taskIds: number[] = [];
        if (args[0].includes(','))
            taskIds = this.getArrayFromCSV(args[0]).map(id => Number.parseInt(id));
        else
            taskIds = [ Number.parseInt(args[0])];

        taskIds.forEach(taskId => {
            const taskToDelete = this.taskUtil.findTaskRecursively(this.taskUtil.getTasks(), taskId);
            if (!taskToDelete) {
                this.logError(`The ID "${taskId}" could not be found.`);
                return;
            }

            this.taskUtil.deleteTask(taskId);
            if (taskToDelete.name) this.logSuccess(`Successfully deleted task: '${taskToDelete.name}'.`);
            if (taskToDelete.description) this.logSuccess(`Successfully deleted blocker: '${taskToDelete.description}'.`);
        })

        this.list([], command);
    }

    private done = (args: string[], command: Command) => {
        if (!CommandUtil.validateArguments(args, 1, 1)) {
            ConsoleUtil.logInvalidArgumentsError(command);
            return;
        }
        let taskIds = [];
        if (args[0].includes(','))
            taskIds = this.getArrayFromCSV(args[0]).map(id => Number.parseInt(id));
        else
            taskIds = [ Number.parseInt(args[0])];

        taskIds.forEach(taskId => {
            const task = this.taskUtil.findTaskRecursively(this.taskUtil.getTasks(), taskId);
            if (!task) {
                this.logError(`The task ID "${taskId}" could not be found.`);
                return;
            }
            
            const newStatus = task.status === TaskStatus.Active ? TaskStatus.Done : TaskStatus.Active;
            const newStatusString = task.status === TaskStatus.Active ? 'done' : 'active';
            this.taskUtil.updateTask(taskId, {status: newStatus});
            if (task.name) this.logSuccess(`Successfully marked task ${newStatusString}: '${task.name}'.`);
            if (task.description) this.logSuccess(`Successfully marked blocker ${newStatusString}: '${task.description}'.`);
        })

        this.list([], command);
    }

    private subtask = (args: string[], command: Command) => {
        if (!CommandUtil.validateArguments(args, 2, 4)) {
            ConsoleUtil.logInvalidArgumentsError(command);
            return;
        }
        let taskId = Number.parseInt(args[0]);
        const task = this.taskUtil.findTaskRecursively(this.taskUtil.getTasks(), taskId);
        if (!task) {
            this.logError(`The task ID "${taskId}" could not be found.`);
            return;
        }

        const subtaskName = args[1];
        const daysUntilDue = Number.parseInt(args[2]);
        const tags = this.getArrayFromCSV(args[3]) || [];
        const due: Date = new Date();
        due.setDate(due.getDate() + daysUntilDue);

        this.taskUtil.addSubtask(taskId, subtaskName, due, tags);
        
        this.logSuccess(`Successfully added subtask : '${subtaskName}'.`);

        this.list([], command);
    }

    private blocker = (args: string[], command: Command) => {
        if (!CommandUtil.validateArguments(args, 2, 2)) {
            ConsoleUtil.logInvalidArgumentsError(command);
            return;
        }
        let taskId = Number.parseInt(args[0]);
        const task = this.taskUtil.findTaskRecursively(this.taskUtil.getTasks(), taskId);
        if (!task) {
            this.logError(`The task ID "${taskId}" could not be found.`);
            return;
        }

        const description = args[1];

        this.taskUtil.addBlocker(taskId, description);
        
        this.logSuccess(`Successfully added blocker : '${description}'.`);

        this.list([], command);
    }

    private list = (args: string[], command: Command) => {
        if (!CommandUtil.validateArguments(args, 0, 1)) {
            ConsoleUtil.logInvalidArgumentsError(command);
            return;
        }

        if (args[0] && !['DONE', 'ACTIVE', 'ALL', 'BLOCKED'].includes(args[0].toUpperCase())) {
            ConsoleUtil.logInvalidArgumentsError(command);
            return;
        }

        this.listTasks(args[0]?.toUpperCase() || "ACTIVE")
    }

    private listTasks = (filter: string = 'ACTIVE', query: string = '', verbose = true) => {
        let tasks = this.taskUtil.getTasks();
        tasks = this.filterTasks(tasks, filter);
        tasks = this.taskUtil.findTaskRecursivelyByQuery(tasks, query);

        console.log(`\n${chalk.gray('///')}  ${chalk.bold('Wrkflow Tasks')}  ${chalk.gray('////////////////////////////////////////')}`)
        this.logTasksRecursively(tasks, verbose);
        console.log(chalk.gray(`////////////////////////////////////////////////////////////`))
    }

    private filterTasks = (tasks: any[], filter: string) => {
        let filteredTasks = [...tasks];
        if (filter === 'DONE') filteredTasks = tasks.filter(task => task.status === TaskStatus.Done);
        else if (filter === 'BLOCKED') filteredTasks = this.taskUtil.findBlockedTasksRecursively(tasks);
        else if (filter === 'ACTIVE') filteredTasks = tasks.filter(task => task.status === TaskStatus.Active);

        return filteredTasks;
    }

    private query = (args: string[], command: Command) => {
        if (!CommandUtil.validateArguments(args, 0, 9999)) {
            ConsoleUtil.logInvalidArgumentsError(command);
            return;
        }
        const verboseDisplay = true;
        const query = args.join(' ');
        let tasks = this.taskUtil.getTasks();
        if (args.length > 0) tasks = this.taskUtil.findTaskRecursivelyByQuery(tasks, query);

        console.log(`\n${chalk.gray('///')}  ${chalk.bold('Wrkflow Tasks')}  ${chalk.gray('////////////////////////////////////////')}\n`);
        this.logTasksRecursively(tasks, verboseDisplay);
        console.log(chalk.gray(`\n////////////////////////////////////////////////////////////`));
    }

    private interactive = (args: string[], command: Command) => {
        if (!CommandUtil.validateArguments(args, 0, 1)) {
            ConsoleUtil.logInvalidArgumentsError(command);
            return;
        }

        if (args[0] && !['DONE', 'ACTIVE', 'ALL', 'BLOCKED'].includes(args[0].toUpperCase())) {
            ConsoleUtil.logInvalidArgumentsError(command);
            return;
        }

        this.startInteraction(args[0]?.toUpperCase() || 'ACTIVE');
    }

    private startInteraction = async (filter: string, query: string = '') => {
        this.listTasks(filter, query)

        const options = [ 'New Task', 'Search', 'Edit Task', 'Exit'];
        const taskAnswer: string = await ConsoleUtil.getInputFromList("Select an Option", options);

        if (taskAnswer === 'New Task') {
            await this.createTaskWithPrompt();
            this.startInteraction(filter, query);
        } else if (taskAnswer === 'Edit Task') {
            this.selectTaskFromPrompt(filter, query);
        } else if (taskAnswer === 'Search') {
            filter = (await ConsoleUtil.getInputFromList('Choose a Status:', ['Active', 'All', 'Blocked', 'Done'])).toUpperCase();
            query = await ConsoleUtil.getInput('Enter a search query:');
            this.startInteraction(filter, query);
        } else {
            console.log('Exiting...');
        }
    }
    
    private selectTaskFromPrompt = async (filter: string, query: string = '') => {
        let tasks = this.filterTasks(this.taskUtil.getTasks(), filter);
        tasks = this.taskUtil.findTaskRecursivelyByQuery(tasks, query);
        let taskOptions = this.getTaskList(tasks, true);
        const taskAnswer: string = await ConsoleUtil.getTaskInput("Select a Task to Edit", taskOptions);
        let idString = taskAnswer.trimLeft().split(' ')[0];
        const idNumber = Number.parseInt(this.removeChalk(idString));
    
        const selectedTask = this.taskUtil.findTaskRecursively(this.taskUtil.getTasks(), idNumber);
        await this.handleTaskInteraction(selectedTask);
        this.startInteraction(filter, query);
    }

    private createTaskWithPrompt = async () => {
        const name = await ConsoleUtil.getInput("Task Name:");
        const due = await ConsoleUtil.getInput("How many days until due?", '');
        const tagString = await ConsoleUtil.getInput("Tags (separate with commas):", '');
        const tags = tagString ? tagString.split(',').map(tag => tag.trim()): [];
        const daysUntilDue = Number.parseInt(due);

        const dueDate: Date = new Date();
        dueDate.setDate(dueDate.getDate() + daysUntilDue);

        this.taskUtil.addTask(name, dueDate, tags);
        Promise.resolve();
    }

    private updateTaskWithPrompt = async (id: number) => {
        const name = await ConsoleUtil.getInput("Task Name:");
        const due = await ConsoleUtil.getInput("How many days until due?", '');
        const tagString = await ConsoleUtil.getInput("Tags (separate with commas):", '');
        const tags = tagString ? tagString.split(',').map(tag => tag.trim()): [];
        const daysUntilDue = Number.parseInt(due);

        const dueDate: Date = new Date();
        dueDate.setDate(dueDate.getDate() + daysUntilDue);
        this.taskUtil.updateTask(id, {name, due: dueDate, tags});
        Promise.resolve();
    }

    private addSubtaskWithPrompt = async (id: number) => {
        const name = await ConsoleUtil.getInput("Subtask Name:");
        const due = await ConsoleUtil.getInput("How many days until due?", '');
        const tagString = await ConsoleUtil.getInput("Tags (separate with commas):", '');
        const tags = tagString ? tagString.split(',').map(tag => tag.trim()): [];
        const daysUntilDue = Number.parseInt(due);

        const dueDate: Date = new Date();
        dueDate.setDate(dueDate.getDate() + daysUntilDue);
        this.taskUtil.addSubtask(id, name, dueDate, tags);
        Promise.resolve();
    }

    private addBlockerWithPrompt = async (id: number) => {
        const description = await ConsoleUtil.getInput("Blocker Description:");
        this.taskUtil.addBlocker(id, description);
        Promise.resolve();
    }
    
    private handleTaskInteraction = async (task: any) => {
        console.log(task.name || task.description);
        
        const options = [
            'Cancel',
            task.status === TaskStatus.Active ? 'Mark Complete' : 'Mark Active',
            'Delete',
            'Add Subtask',
            'Add Blocker',
            'Edit',
        ]

        const option: string = await ConsoleUtil.getTaskInput("Select an option", options);

        if (option === 'Delete') {
            const confirmed = await ConsoleUtil.getConfirmation("Are you sure?")
            if (confirmed) this.taskUtil.deleteTask(task.id);

        } else if (['Mark Complete', 'Mark Active'].includes(option)) {
            const status = task.status === TaskStatus.Active ? TaskStatus.Done : TaskStatus.Active;
            this.taskUtil.updateTask(task.id, {status});
        } else if (option === 'Edit') {
            await this.updateTaskWithPrompt(task.id);
        } else if (option === 'Add Subtask') {
            await this.addSubtaskWithPrompt(task.id);
        } else if (option === 'Add Blocker') {
            await this.addBlockerWithPrompt(task.id);
        }

        return Promise.resolve();
    }

    private removeChalk = (text: string): string => {
        return text.replace(
            /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
    }

    private logTasksRecursively = (tasks: Task[], verbose: boolean = false, depth: number = 1) => {
        const activeTasks = tasks.filter(task => task.status == TaskStatus.Active && task.blockers.length <= 0);
        const blockedTasks = tasks.filter(task => task.status == TaskStatus.Active && task.blockers.length > 0);
        const doneTasks = tasks.filter(task => task.status == TaskStatus.Done);
        activeTasks.sort(function(a,b) {
             return new Date(a.due).valueOf() - new Date(b.due).valueOf();
        });
        blockedTasks.sort(function(a,b) {
             return new Date(a.due).valueOf() - new Date(b.due).valueOf();
        });
        if (verbose || depth > 1) tasks = [...activeTasks, ...blockedTasks, ...doneTasks];
        else tasks = [...activeTasks, ...blockedTasks];

        if (tasks.length <= 0 && depth <= 1) {
            console.log(`-- no tasks --`);
            return;
        }

        tasks.forEach(task => {
            var depthTab = new Array(depth).join('     ');

            let statusString = '';
            if (task.status === TaskStatus.Done) statusString = '✔️  ';
            else if (this.taskUtil.isTaskBlocked(task)) statusString = '✋ ';

            if (verbose) {
                let dueString = task.due ? `Due: ${new Date(task.due).toLocaleDateString()}` : '';
                dueString = this.getColorizedDueString(task.due, dueString);
                const tagString = task.tags.length ? `Tags: ${task.tags.join(', ')}` : '';
                const comma = (tagString && dueString) ? ', ' : '';
                const verboseString = (tagString || dueString) ? chalk.blueBright(`(${dueString}${comma}${tagString})`) : '';
                console.log(`  ${depthTab}${chalk.blueBright(task.id)}  ${statusString}${task.name}  ${verboseString}`);
            }
            else
                console.log(`  ${depthTab}${chalk.blueBright(task.id)}  ${statusString}${task.name}`);
                
            task.blockers.forEach(blocker => {
                let blockerStatusString = '';
                if (blocker.status === TaskStatus.Done) blockerStatusString = '✔️  ';

                const colorFunction = blocker.status === TaskStatus.Active ? chalk.redBright : chalk.red;
                console.log(`       ${depthTab}${chalk.blueBright(blocker.id)}  ${blockerStatusString}${chalk.redBright(blocker.description)}`);
            });
            this.logTasksRecursively(task.subtasks, verbose, depth + 1);
        });
    }

    private getTaskList = (tasks: Task[], verbose: boolean = false, depth: number = 1): any[] => {
        const activeTasks = tasks.filter(task => task.status == TaskStatus.Active && task.blockers.length <= 0);
        const blockedTasks = tasks.filter(task => task.status == TaskStatus.Active && task.blockers.length > 0);
        const doneTasks = tasks.filter(task => task.status == TaskStatus.Done);
        activeTasks.sort(function(a,b) {
             return new Date(a.due).valueOf() - new Date(b.due).valueOf();
        });
        blockedTasks.sort(function(a,b) {
             return new Date(a.due).valueOf() - new Date(b.due).valueOf();
        });
        if (verbose || depth > 1) tasks = [...activeTasks, ...blockedTasks, ...doneTasks];
        else tasks = [...activeTasks, ...blockedTasks];


        let taskList: any[] = [];
        tasks.forEach(task => {
            var depthTab = new Array(depth).join('     ');

            let statusString = '';
            if (task.status === TaskStatus.Done) statusString = '✔️  ';
            else if (this.taskUtil.isTaskBlocked(task)) statusString = '✋ ';

            if (verbose) {
                let dueString = task.due ? `Due: ${new Date(task.due).toLocaleDateString()}` : '';
                dueString = this.getColorizedDueString(task.due, dueString);
                const tagString = task.tags.length ? `Tags: ${task.tags.join(', ')}` : '';
                const comma = (tagString && dueString) ? ', ' : '';
                const verboseString = (tagString || dueString) ? chalk.blueBright(`(${dueString}${comma}${tagString})`) : '';
                taskList.push(`${depthTab}${chalk.blueBright(task.id)}  ${statusString}${task.name}  ${verboseString}`);
            }
            else
                taskList.push(`${depthTab}${chalk.blueBright(task.id)}  ${statusString}${task.name}`);
                
            task.blockers.forEach(blocker => {
                let blockerStatusString = '';
                if (blocker.status === TaskStatus.Done) blockerStatusString = '✔️  ';

                taskList.push(`     ${depthTab}${chalk.blueBright(blocker.id)}  ${blockerStatusString}${chalk.redBright(blocker.description)}`);
            });

            taskList = [...taskList, ...this.getTaskList(task.subtasks, verbose, depth + 1)];
        });

        return taskList;
    }

    private getColorizedDueString = (date: Date, dueString: string) => {
        if (this.dateIsDueWithin(date, 0)) return chalk.redBright(dueString);
        if (this.dateIsDueWithin(date, 1)) return chalk.hex('#FFA500')(dueString);
        if (this.dateIsDueWithin(date, 6)) return chalk.yellowBright(dueString);

        return dueString;
    }

    private dateIsDueWithin = (date: Date, days: number) => {
        const today = new Date();
        const dueDate = new Date(date);
        today.setDate(today.getDate() + days);
        return today > dueDate;
    }

    private getArrayFromCSV = (csvString: string): string[] => {
        if (!csvString) return [];
        return csvString.split(',').map(value => value.trim())
    }

    private logSuccess = (response: string) => {
        console.log(chalk.greenBright(response));
    }

    private logError = (response: string) => {
        console.log(chalk.redBright(response));
    }

    // Command Configuration

    protected readonly commands: Command[] = [
        {
            string: 'add',
            function: this.add,
            usage: `tsk add <task name> <days until due (number, optional)> <tags (single or comma-separated, optional)>`,
            description: `Adds a new task.`
        },
        {
            string: 'list',
            function: this.list,
            usage: `tsk list <'all', 'active', 'blocked', or 'done' (filters by status, optional, default: 'active')>`,
            description: `Lists all tasks.`
        },
        {
            string: 'query',
            function: this.query,
            usage: `tsk query <search query>`,
            description: `Lists all tasks matching the search query.`
        },
        {
            string: 'remove',
            function: this.remove,
            usage: `tsk remove <ID (single or comma-separated)>`,
            description: `Removes a task.`
        },
        {
            string: 'done',
            function: this.done,
            usage: `tsk done <ID (single or comma-separated)>`,
            description: `Toggles a task or set of tasks between active and done states.`
        },
        {
            string: 'subtask',
            function: this.subtask,
            usage: `tsk subtask <ID> <task name> <days until due (number, optional)> <tags (single or comma-separated, optional)>`,
            description: `Adds a subtask to an existing task.`
        },
        {
            string: 'blocker',
            function: this.blocker,
            usage: `tsk blocker <ID> <blocker description>`,
            description: `Adds a blocker to an existing task.`
        },
        {
            string: 'interactive',
            function: this.interactive,
            usage: `testing...`,
            description: `testing...`
        },
    ];
}