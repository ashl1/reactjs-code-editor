arr = ["auto", "break", "case", "char", "const", "continue", "default", "do", "double", "else", "enum", "extern", "float", "for", "goto", "if", "int", "long", "register", "return", "short", "signed", "sizeof", "static", "struct", "switch", "typedef", "union", "unsigned", "void", "volatile", "while"]

states = [];
statesLength = 0;
finiteStates = [];
for string in arr:
	state = 0;
	for char in string:
		if state >= statesLength:
			states.append(dict())
			statesLength += 1
		if not char in states[state]:
			states[state][char] = statesLength;
			state = statesLength;
			statesLength += 1
		else:
			state = states[state][states[state][char]];
	if not state in finiteStates:
		finiteStates.append(state)

print(states)