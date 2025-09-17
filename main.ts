function scramble_cards() {
    scrambled_cards = []
    _temp_cards = cards
    _rand = 0
    while (_temp_cards.length != 0) {
        _rand = randint(0, _temp_cards.length - 1)
        _value = _temp_cards[_rand]
        _temp_cards.removeAt(_rand)
        scrambled_cards.push(_value)
    }
}
function fold() {
    send_message(dealer_id, MSG_PLAYER_FINISH_TURN, "-1")
    game_stage = GAME_STAGE_PLAYING
}
function init_list_values() {
    suits = [
        "H",
        "D",
        "C",
        "S"
    ]
    card_values_alpha = [
        "J",
        "Q",
        "K",
        "A"
    ]
    card_values = [
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10
    ]
}
function get_message_contents(message: string) {
    _delimeters_found_contents = 0
    for (let _k = 0; _k <= message.length - 1; _k++) {
        if (message.charAt(_k) == "|") {
            _delimeters_found_contents += 1
            if (_delimeters_found_contents == 2) {
                return message.substr(_k + 1, message.length - _k)
            }
        }
    }
    return ""
}
function get_message_kind(message: string) {
    _delimeters_found_kind = 0
    for (let _j = 0; _j <= message.length - 1; _j++) {
        if (message.charAt(_j) == "|") {
            _delimeters_found_kind += 1
            if (_delimeters_found_kind == 2) {
                return parseInt(message.substr(_last_delimeter_index + 1, _j))
            } else {
                _last_delimeter_index = _j
            }
        }
    }
    return -1
}
function send_message(reciever: number, kind: number, contents: string) {
    _message = "" + reciever + "|" + kind + "|" + contents
    if (_message.length >= 19) {
        led.stopAnimation()
        basic.showString("ERROR, MESSAGE TOO LONG")
    }
    radio.sendString(_message)
}
input.onButtonPressed(Button.A, function () {
    if (game_stage == GAME_STAGE_ROLE_SELECTION) {
        select_role(ROLE_DEALER)
        game_stage = GAME_STAGE_FINDING_PLAYERS
        while (game_stage == GAME_STAGE_FINDING_PLAYERS) {
            send_message(0, MSG_JOIN_GAME_PING, "")
            basic.pause(1000)
        }
    } else if (game_stage == GAME_STAGE_MY_TURN) {
        change_bet(-1)
    }
})
function checkSuits(suits: number[]) {
    first_suit = suits[0]
    index23 = 1
    same_suits = true
    while (same_suits == true && index23 < suits.length) {
        if (first_suit == suits[index23]) {
            index23 += 1
        } else {
            same_suits = false
        }
    }
    return same_suits
}
radio.onReceivedString(function (msg) {
    // Dealer receives join requests while finding players
    _reciever = get_message_reciever(msg)
    _sender = radio.receivedPacket(RadioPacketProperty.SerialNumber)
    _kind = get_message_kind(msg)
    _contents = get_message_contents(msg)
    if (_reciever == 0 || _reciever == serial_number) {
        if (role == ROLE_DEALER) {
            msg_recieved_dealer(_sender, _kind, _contents)
        } else if (role == ROLE_PLAYER) {
            msg_recieved_player(_sender, _kind, _contents)
        }
    }
})
function deal_cards() {
    for (let index = 0; index <= players.length - 1; index++) {
        
        player_cards[index][0] = scrambled_cards.pop()
        player_cards[index][1] = scrambled_cards.pop()
        send_message(players[index], MSG_GIVE_HAND, "" + player_cards[index][0] + "-" + player_cards[index][1])
    }
}
function get_player_index(player_id: number) {
    for (let _l = 0; _l <= players.length - 1; _l++) {
        if (players[_l] == player_id) {
            return _l
        }
    }
    return -1
}
function start_game() {
    game_stage = GAME_STAGE_PLAYING
    send_message(0, MSG_START_GAME, "")
    led.stopAnimation()
    next_round()
}
function get_message_reciever(message: string) {
    for (let _i = 0; _i <= message.length - 1; _i++) {
        if (message.charAt(_i) == "|") {
            return parseInt(message.substr(0, _i))
        }
    }
    return -1
}
function change_bet(amount: number) {
    led.stopAnimation()
    if (bet + amount > money) {
        bet = money
    } else if (bet + amount < highest_bet) {
        bet = highest_bet
    } else {
        bet += amount
    }
}
function build_card_list() {
    cards = []
    i = 0
    for (let suit of suits) {
        for (let card_value of card_values) {
            cards.push("" + card_value + suit)
            i += 1
        }
        for (let card_value2 of card_values_alpha) {
            cards.push("" + card_value2 + suit)
            i += 1
        }
    }
}
function add_player(player_id: number) {
    players.push(player_id)
    player_money.push(200)
    player_cards.push([])
}
function call_bet_raise() {
    // we use the same function for calling, betting and raising
    send_message(dealer_id, MSG_PLAYER_FINISH_TURN, "" + bet + "")
    game_stage = GAME_STAGE_PLAYING
}
function init_constants() {
    GAME_STAGE_ROLE_SELECTION = 0
    GAME_STAGE_FINDING_PLAYERS = 1
    GAME_STAGE_WAITING_FOR_GAME_TO_START = 2
    GAME_STAGE_PLAYING = 3
    GAME_STAGE_MY_TURN = 4
    GAME_STAGE_FINISHED = 5
    ROLE_DEALER = 0
    ROLE_PLAYER = 1
    MSG_PLAYER_START_TURN = 0
    MSG_SEARCHING_FOR_PLAYERS = 1
    MSG_PLAYER_FINISH_TURN = 2
    MSG_PLAYER_JOIN_CONFIRM = 3
    MSG_JOIN_GAME_PING = 4
    MSG_START_GAME = 5
    MSG_GIVE_HAND = 6
}
function msg_recieved_dealer(sender: number, msg_kind: number, msg_contents: string) {
    if (game_stage == GAME_STAGE_FINDING_PLAYERS) {
        if (msg_kind == MSG_PLAYER_JOIN_CONFIRM) {
            add_player(radio.receivedPacket(RadioPacketProperty.SerialNumber))
        }
    }
    if (game_stage == GAME_STAGE_PLAYING) {
        if (msg_kind == MSG_PLAYER_FINISH_TURN) {
            _bet = parseInt(msg_contents)
            pot += _bet
            if (_bet > highest_bet) {
                highest_bet = parseInt(msg_contents)
                players_left_to_call = players.length
            } else {
                players_left_to_call += 0 - 1
            }
            if (current_player == players.length - 1) {
                current_player = 0
            } else {
                current_player += 1
            }
            // calculate winner here
            if (players_left_to_call > 0) {
                send_message(current_player, MSG_PLAYER_START_TURN, "" + highest_bet)
            } else {
                player_money[_winner] += pot
                for (let index2 = 0; index2 <= players.length - 1; index2++) {
                    if (player_money[index2] == 0) {
                        players.removeAt(index2)
                        player_money.removeAt(index2)
                    }
                }
            }
            next_round()
        }
    }
}
input.onGesture(Gesture.ScreenDown, function () {
    if (game_stage == GAME_STAGE_MY_TURN) {
        fold()
    }
})
input.onButtonPressed(Button.AB, function () {
    led.stopAnimation()
    if (game_stage == GAME_STAGE_FINDING_PLAYERS) {
        if (role == ROLE_DEALER) {
            // terminate here,idk how to though
            if (players.length == 0) {

            }
            start_game()
        }
    }
    if (role == ROLE_DEALER) {
        console.log(board_cards.length)
        for (let card of board_cards) {
            console.log(card)
        }
    }
    if (role == ROLE_PLAYER) {
        console.log(my_cards)
        basic.showString("" + my_cards[0] + my_cards[1])
    }
})
input.onButtonPressed(Button.B, function () {
    if (game_stage == GAME_STAGE_ROLE_SELECTION) {
        select_role(ROLE_PLAYER)
        game_stage = GAME_STAGE_FINDING_PLAYERS
    } else if (game_stage == GAME_STAGE_MY_TURN) {
        change_bet(1)
    }
})
function play_round_dealer() {
    // datalogger.log(datalogger.createCV("play round dealer", 0))
    players_left_to_call = players.length
    current_player = 0
    highest_bet = 0
    send_message(players[0], MSG_PLAYER_START_TURN, "" + current_player)
}
input.onGesture(Gesture.Shake, function () {
    if (game_stage == GAME_STAGE_MY_TURN) {
        call_bet_raise()
    }
})
function add_board_cards(count: number) {
    for (let index = 0; index < count; index++) {
        _card = scrambled_cards.pop()
        board_cards.push(_card)
        console.log(_card)
    }
}
function msg_recieved_player(sender: number, msg_kind: number, msg_contents: string) {
    if (game_stage == GAME_STAGE_FINDING_PLAYERS && msg_kind == MSG_JOIN_GAME_PING) {
        dealer_id = sender
        send_message(0, MSG_PLAYER_JOIN_CONFIRM, "")
        game_stage = GAME_STAGE_WAITING_FOR_GAME_TO_START
    } else if (msg_kind == MSG_START_GAME && game_stage == GAME_STAGE_WAITING_FOR_GAME_TO_START) {
        game_stage = GAME_STAGE_PLAYING
    } else if (msg_kind == MSG_PLAYER_START_TURN) {
        game_stage = GAME_STAGE_MY_TURN
        led.stopAnimation()
        highest_bet = parseInt(msg_contents)
        bet = highest_bet
    }
    if (msg_kind == MSG_GIVE_HAND) {
        my_cards[0] = msg_contents.substr(0, 2)
        my_cards[1] = msg_contents.substr(3, 5)
    }
}

function select_role(selected_role: number) {
    game_stage = GAME_STAGE_FINDING_PLAYERS
    role = selected_role
    led.stopAnimation()
    if (role == ROLE_DEALER) {
        _display_char = "D"
    } else if (role == ROLE_PLAYER) {
        _display_char = "P"
    } else {
        _display_char = "ERROR"
    }
    basic.showString(_display_char)
}
function next_round() {
    players_left_to_call = players.length
    current_player = 0
    highest_bet = 0
    console.log("next round index: " + round_index)
    if (round_index == 0) {
        deal_cards()
        round_index += 1
    } else if (round_index == 1) {
        add_board_cards(3)
        round_index += 1
    } else if (round_index == 2) {
        add_board_cards(1)
        round_index += 1
    } else if (round_index == 3) {
        add_board_cards(1)
        round_index += 1
    } else {
        // pay out jackpot
        round_index = 0
        // basic.showString("Player won")
        // game_stage = GAME_STAGE_FINISHED
        if (players.length == 1) {

        }
    }
    send_message(players[0], MSG_PLAYER_START_TURN, "" + current_player)
}
let row = 0
let current = 0
let next = 0
let spare_card = 0
let spare_value = 0
let g = 0
let _display_char = ""
let straight = 0
let v_result = 0
let flush = false
let value = ""
let _card = ""
let current_player = 0
let players_left_to_call = 0
let _bet = 0
let MSG_PLAYER_JOIN_CONFIRM = 0
let MSG_SEARCHING_FOR_PLAYERS = 0
let MSG_PLAYER_START_TURN = 0
let GAME_STAGE_FINISHED = 0
let GAME_STAGE_WAITING_FOR_GAME_TO_START = 0
let i = 0
let highest_bet = 0
let bet = 0
let MSG_START_GAME = 0
let MSG_GIVE_HAND = 0
let player_cards: string[][] = []
let _card_2 = ""
let _card_1 = ""
let players: number[] = []
let ROLE_PLAYER = 0
let _contents = ""
let _kind = 0
let _sender = 0
let _reciever = 0
let same_suits = false
let index23 = 0
let first_suit = 0
let MSG_JOIN_GAME_PING = 0
let GAME_STAGE_FINDING_PLAYERS = 0
let ROLE_DEALER = 0
let GAME_STAGE_MY_TURN = 0
let _message = ""
let _last_delimeter_index = 0
let _delimeters_found_kind = 0
let _delimeters_found_contents = 0
let card_values: number[] = []
let card_values_alpha: string[] = []
let suits: string[] = []
let GAME_STAGE_PLAYING = 0
let MSG_PLAYER_FINISH_TURN = 0
let dealer_id = 0
let _value = ""
let _rand = 0
let cards: string[] = []
let _temp_cards: string[] = []
let scrambled_cards: string[] = []
let GAME_STAGE_ROLE_SELECTION = 0
let game_stage = 0
let serial_number = 0
let money = 0
let board_cards: string[] = []
let my_cards: string[] = []
let _winner = 0
let _message2 = ""
let searching_for_players = 0
let player_money: number[] = []
let pot: number = 0
let role = 0
let round_index = 0
let card_groups: number[] = []
let combos: any[] = []
let result = ""
money = 20
serial_number = control.deviceSerialNumber()
radio.setTransmitSerialNumber(true)
init_constants()
let radio_group_number = 68
radio.setGroup(radio_group_number)
game_stage = GAME_STAGE_ROLE_SELECTION
init_list_values()
build_card_list()
scramble_cards()
while (game_stage == GAME_STAGE_ROLE_SELECTION) {
    basic.showString("A=DEALER:B=PLAYER")
}
basic.forever(function () {
    if (role == ROLE_PLAYER) {
        if (game_stage == GAME_STAGE_MY_TURN) {
            basic.showNumber(bet)
        } else if (game_stage == GAME_STAGE_PLAYING) {
            basic.showString("WAITING")
        }
    } else if (role == ROLE_DEALER) {

    } else {

    }
})
