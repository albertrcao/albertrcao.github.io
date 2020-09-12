# Albert Cao
# 06/29/20

# List and dictionary comprehension knowledge pulled from:
# https://stackoverflow.com/questions/28589583/how-to-make-new-list-of-elements-from-existing-list-in-python
# https://stackoverflow.com/questions/27733685/iterating-over-dict-values

import random

# Returns a printable visualization of the board w/ numbers.
def make_num_board(state):
    count = 0
    display = ""

    for i in state:
        count += 1
        if (count % 3 == 0):
            display = display + str(i) + "\n"
        else:
            display = display + str(i) + " "

    return display

# Returns a printable visualization of the board w/ Xs and Os.
def make_sym_board(state):
    display = ""

    for i in state:
        if (i.isdigit()):
            i = "."
        
        display = display + i

    return display

# Checking all legal moves. Returns a list of indices.
def check_moves(state):
    move_list = []
    random_moves = []

    for i in state:
        if (i != "X" and i != "O"):
            move_list.append(i)

    random_moves = sorted(move_list, key = lambda x: random.random())

    return random_moves

# Checking if a game state is a win. Returns True or False.
def check_win(state):
    # Checking board horizontally.
    if (state[0] == state[1] and state[1] == state[2]):
        return True
    elif (state[3] == state[4] and state[4] == state[5]):
        return True
    elif (state[6] == state[7] and state[7] == state[8]):
        return True
    # Checking board vertically.
    elif (state[0] == state[3] and state[3] == state[6]):
        return True
    elif (state[1] == state[4] and state[4] == state[7]):
        return True
    elif (state[2] == state[5] and state[5] == state[8]):
        return True
    # Checking board diagonally.
    elif (state[0] == state[4] and state[4] == state[8]):
        return True
    elif (state[2] == state[4] and state[4] == state[6]):
        return True
    else:
        return False

# Conducting a random playout from a single move.
def playout(state, move, player):
    result = ""

    for j in state:
        if move == j:
            state[j - 1] = player
            legal_moves = check_moves(state)

            if (check_win(state) == True):
                if (player == "O"):
                    return "Win"
                elif (player == "X"):
                    return "Loss"
            
            if not legal_moves:
                return "Draw"

            if (player == "O"):
                result = playout(state, random.choice(legal_moves), "X")

                if (result != None):
                    return result
            elif (player == "X"):
                result = playout(state, random.choice(legal_moves), "O")

                if (result != None):
                    return result

# Function to start a new game.
def play_a_new_game():
    # Initializing the board.
    board = list(range(10))
    board.pop(0)
    playout_board = []
    num_display = ""
    sym_display = ""
    legal_moves = []
    moves_record = {}
    moves_wins = {}
    best_move = 0
    most_wins = 0
    status = False
    
    # Greeting the player.
    print("BEEP BOOP.")
    print("BOP.")
    print("")

    # Printing the numbered board.
    num_display = make_num_board(board)
    print(num_display)

    # Printing the symbolized board.
    sym_display = make_sym_board(num_display)
    print(sym_display)

    # Running the game.
    while (status == False):
        legal_moves = []
        moves_record = {}
        moves_wins = {}
        best_move = 0
        most_wins = 0

        # Checking for legal moves.
        legal_moves = check_moves(board)

        # If no moves are left, the game is a draw.
        if not legal_moves:
            print("BRAP. DRAW.")
            return

        # Asking user for input.
        move = input("BLORP. YOUR MOVE: ")

        # If user enters an illegal move.
        if int(move) not in board:
            print("")
            print("INVALID MOVE. BLAP.")

            print("")
            continue

        # Player move.
        for i in board:
            if i == int(move):
                board[i - 1] = "X"

        print("")
        
        # Printing the symbolized board.
        num_display = make_num_board(board)
        sym_display = make_sym_board(num_display)
        print(sym_display)

        # Checking win status.
        status = check_win(board)

        if (status == True):
            print("GAME OVER. BLOOP. YOU WIN. WOP.")
            return

        # Preparing variables for playouts.
        legal_moves = check_moves(board)
        moves_record = { i : [] for i in legal_moves }

        # Conducting playouts.
        for i in range(100):
            for j in legal_moves:
                playout_board = [j for j in board]
                moves_record[j].append(playout(playout_board, j, "O"))

        # Choosing the move that resulted in the most wins + draws.
        for i in moves_record.keys():
            wins_draws = 0

            for j in moves_record[i]:
                if (j == "Win" or j == "Draw"):
                    wins_draws += 1
            
            moves_wins[i] = wins_draws

        for i in moves_wins.keys():
            if moves_wins[i] > most_wins:
                best_move = i
                most_wins = moves_wins[i]

        # CPU move.
        print("BOOP. MY MOVE: " + str(best_move))
        print("")

        for i in board:
            if i == int(best_move):
                board[i - 1] = "O"

        # Printing the symbolized board.
        num_display = make_num_board(board)
        sym_display = make_sym_board(num_display)
        print(sym_display)

        # Checking win status.
        status = check_win(board)

        if (status == True):
            print("BEEP. GAME OVER. VICTORY FOR THE MACHINES. SWOOP.")
            return     

if (__name__ == "__main__"):
    play_a_new_game()