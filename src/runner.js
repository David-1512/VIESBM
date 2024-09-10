class Runner {
    constructor() {
        this.stack = [];  // S (pila de datos)
        this.environment = [new Map()]; // B (pila de entornos)
        this.contexts = []; // D (pila de contextos)

        // Definir un mapa de funciones que reemplazan el switch y los condicionales
        this.instructions = {
            'HLT': () => null,  // Detener la ejecución
            'LDV': (params) => { this.stack.push(Number(params[0])); return null; },
            'ADD': () => { this.stack.push(this.stack.pop() + this.stack.pop()); return null; },
            'PRN': () => this.stack.pop(),  // Retornar el valor para imprimirlo en otro lugar
            'BLD': (params) => { this.stack.push(this.environment[params[0]].get(params[1])); return null; },
            'LDF': (params) => { this.stack.push({ type: 'closure', ref: params[0] }); return null; },
            'APP': (params, code, ip) => this.applyFunction(params, code, ip),
            'RET': () => this.returnFromFunction(),
            'POP': () => { this.stack.pop(); return null; },
            'SWP': () => this.swap(),
            'MUL': () => { this.stack.push(this.stack.pop() * this.stack.pop()); return null; },
            'NEG': () => { this.stack.push(-this.stack.pop()); return null; },
            'SGN': () => { this.stack.push(Math.sign(this.stack.pop())); return null; },
            'AND': () => this.binaryOp((a, b) => a && b),
            'OR': () => this.binaryOp((a, b) => a || b),
            'XOR': () => this.binaryOp((a, b) => a ^ b),
            'NOT': () => { this.stack.push(!this.stack.pop()); return null; },
            'CAT': () => { this.stack.push(this.stack.pop() + this.stack.pop()); return null; },
            'TOS': () => { this.stack.push(this.stack[this.stack.length - 1].toString()); return null; },
            'LNT': () => { this.stack.push(this.stack.pop().length); return null; },
            'LIN': () => this.listInsert(),
            'LTK': () => this.lookupKey(),
            'LRK': () => this.sliceArray(),
            'TOL': () => this.toList(),
            'BR': (params) => Number(params[0]),  // Salto incondicional
            'BT': (params) => this.stack.pop() ? Number(params[0]) : null,  // Salto condicional
            'CST': (params) => { this.stack.push(params[0]); return null; },
            'INO': (params) => { this.stack.push(typeof params[0] === 'number'); return null; },
            'NOP': () => null
        };
    }

    // Método optimizado usando bucle en lugar de recursión
    execute(code, ip = 0) {
        while (ip < code.length) {
            const { mnemonic, params } = code[ip] || this.defaultInstruction();
            const instruction = this.getInstruction(mnemonic);
            ip = instruction(params, code, ip) ?? ip + 1;
        }
        return null;  // Finalización
    }

    // Validar y obtener la instrucción, con manejo de errores más informativo
    getInstruction(mnemonic) {
        return this.instructions[mnemonic] || this.handleUnknownInstruction(mnemonic);
    }

    // Instrucción por defecto si `ip` está fuera de rango
    defaultInstruction() {
        return { mnemonic: 'HLT', params: [] };  // Detener si no hay más instrucciones
    }

    // Manejo de errores sin `if`, con información adicional
    handleUnknownInstruction(mnemonic) {
        return () => { throw new Error(`Instrucción no reconocida: ${mnemonic}`); };
    }

    applyFunction(params, code, ip) {
        const closure = this.stack.pop();
        const value = this.stack.pop();
        this.contexts.push({ ip: ip, environment: [...this.environment] });
        this.environment.push(new Map([[0, value]]));
        return this.findFunction(closure.ref, code);  // Salta a la función
    }

    returnFromFunction() {
        const retValue = this.stack.pop();
        const context = this.contexts.pop();
        this.environment = context.environment;
        this.stack.push(retValue);
        return context.ip;  // Retorna al contexto previo
    }

    swap() {
        const top = this.stack.pop();
        const second = this.stack.pop();
        this.stack.push(top);
        this.stack.push(second);
        return null;
    }

    binaryOp(operation) {
        const b = this.stack.pop();
        const a = this.stack.pop();
        this.stack.push(operation(a, b));
        return null;
    }

    findFunction(label, code) {
        return code.findIndex(inst => inst.mnemonic === label);
    }

    listInsert() {
        const list = this.stack.pop();
        const item = this.stack.pop();
        list.unshift(item);  // Insertar en la lista
        this.stack.push(list);
        return null;
    }

    lookupKey() {
        const key = this.stack.pop();
        const obj = this.stack.pop();
        this.stack.push(obj[key]);
        return null;
    }

    sliceArray() {
        const index = this.stack.pop();
        const arr = this.stack.pop();
        this.stack.push(arr.slice(index));
        return null;
    }

    toList() {
        const str = this.stack.pop();
        this.stack.push([...str]);  // Convertir a lista
        return null;
    }
}

module.exports = Runner;