function scramble_cards () {
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
function fold () {
    send_message(dealer_id, MSG_PLAYER_FINISH_TURN, "-1")
    game_stage = GAME_STAGE_PLAYING
}
function init_list_values () {
    suits = [
    "H",
    "D",
    "C",
    "S"
    ]
    card_values_alpha = [
    "X",
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
    9
    ]
}
function get_message_contents (message: string) {
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
function get_message_kind (message: string) {
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
function send_message (reciever: number, kind: number, contents: string) {
    _message = "" + reciever + "|" + kind + "|" + contents
    if (_message.length >= 19) {
        led.stopAnimation()
        console.log("The message that would have been too long: ")
console.log(_message)
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
    } else if (game_stage == GAME_STAGE_PLAYING) {
        if (role == ROLE_DEALER) {
            show_board_cards()
        }
    }
})
function checkSuits() {
    first_suit = global_suits[0]
    index22 = 1
    same_suits2 = true
    while (same_suits2 == true && index22 < suits.length) {
        if (first_suit == global_suits[index22]) {
            index22 += 1
        } else {
            same_suits2 = false
        }
    }
    return same_suits2
}
function show_board_cards () {
    if (game_stage == GAME_STAGE_PLAYING && role == ROLE_DEALER) {
        led.stopAnimation()
        dealer_display_mode = "cards"
    }
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
function deal_cards () {
    for (let index = 0; index <= players.length - 1; index++) {
        player_cards[index][0] = scrambled_cards.pop()
        player_cards[index][1] = scrambled_cards.pop()
        send_message(players[index], MSG_GIVE_HAND, "" + player_cards[index][0] + "-" + player_cards[index][1])
    }
}
function show_pot () {
    if (game_stage == GAME_STAGE_PLAYING && role == ROLE_DEALER) {
        led.stopAnimation()
        dealer_display_mode = "pot"
    }
}
function get_player_index (player_id: number) {
    for (let _l = 0; _l <= players.length - 1; _l++) {
        if (players[_l] == player_id) {
            return _l
        }
    }
    return -1
}
function start_game () {
    console.log("PLAYERS: " + players.length)
game_stage = GAME_STAGE_PLAYING
    send_message(0, MSG_START_GAME, "")
    led.stopAnimation()
    next_round()
}
function get_message_reciever (message: string) {
    for (let _i = 0; _i <= message.length - 1; _i++) {
        if (message.charAt(_i) == "|") {
            return parseInt(message.substr(0, _i))
        }
    }
    return -1
}
function change_bet (amount: number) {
    led.stopAnimation()
    if (bet + amount > money) {
        bet = money
    } else if (bet + amount < highest_bet) {
        bet = highest_bet
    } else {
        bet += amount
    }
}
function build_card_list () {
    cards = []
    j = 0
    for (let suit of suits) {
        for (let card_value of card_values) {
            cards.push("" + card_value + suit)
            j += 1
        }
        for (let card_value2 of card_values_alpha) {
            cards.push("" + card_value2 + suit)
            j += 1
        }
    }
}
function add_player (player_id: number) {
    players.push(player_id)
    player_money.push(money)
    player_cards.push([])
}
function call_bet_raise () {
    // we use the same function for calling, betting and raising
    game_stage = GAME_STAGE_PLAYING
    if (bet == 0) {
        console.log("bet is 0")
    }
    send_message(dealer_id, MSG_PLAYER_FINISH_TURN, "" + bet + "")
    money += 0 - bet
    led.stopAnimation()
}
function init_constants () {
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
    MSG_PLAYER_LOSE_GAME = 7
}
function msg_recieved_dealer (sender: number, msg_kind: number, msg_contents: string) {
    if (game_stage == GAME_STAGE_FINDING_PLAYERS) {
        if (msg_kind == MSG_PLAYER_JOIN_CONFIRM) {
            if (get_player_index(radio.receivedPacket(RadioPacketProperty.SerialNumber)) == -1) {
                add_player(radio.receivedPacket(RadioPacketProperty.SerialNumber))
            }
        }
    }
    if (game_stage == GAME_STAGE_PLAYING) {
        if (msg_kind == MSG_PLAYER_FINISH_TURN) {
            console.log("PLAYER " + get_player_index(radio.receivedPacket(RadioPacketProperty.SerialNumber)) + " FINISHED");
_player_id = radio.receivedPacket(RadioPacketProperty.SerialNumber)
            // subtract bet cost from player money
            _player_index = get_player_index(_player_id)
            // Wrong player sent bet
            if (_player_index != current_player) {
                return
            }
            _bet = parseInt(msg_contents)
            if (_bet == -1) {
                players_folded.push(_player_id)
                players_left_to_call = players_left_to_call - 1
            }
            pot += _bet
            player_money[_player_index] = player_money[_player_index] - _bet
            if (_bet > highest_bet) {
                highest_bet = parseInt(msg_contents)
                players_left_to_call = players.length - 1
            } else {
                players_left_to_call = players_left_to_call - 1
            }
            console.log("PLAYERS LEFT: " + players_left_to_call);
console.log("PLAYERS LIST: " + players.join(", "));
if (current_player == players.length - 1) {
                current_player = 0
            } else {
                current_player += 1
            }
            // calculate winner here
            if (players_left_to_call > 0) {
                console.log("START TURN TO: " + current_player);
send_message(players[current_player], MSG_PLAYER_START_TURN, "" + highest_bet)
            } else {
            	
            }
            // Only call next_round if there are
            // no players left to play this round
            if (players_left_to_call == 0) {
                next_round()
            }
        }
    }
}
input.onGesture(Gesture.ScreenDown, function () {
    if (game_stage == GAME_STAGE_MY_TURN) {
        fold()
    }
})
function pay_winner () {
    let _winner = 0
    players_folded = []
    console.log("calculating a winner...");
player_money[_winner] = player_money[_winner] + pot
    console.log(player_money);
console.log(players);
for (let index22 = 0; index22 <= players.length - 1; index22++) {
        if (player_money[index22] == 0) {
            console.log("sending msg lossed game")
send_message(players[index22], MSG_PLAYER_LOSE_GAME, "")
            players.removeAt(index22)
            player_money.removeAt(index22)
        }
    }
    console.log("players after removing loosers:")
console.log(player_money)
console.log(players)
}
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
        if (player_display_mode == "bet") {
            player_display_mode = "cards"
        } else if (player_display_mode == "cards" && game_stage == GAME_STAGE_MY_TURN) {
            player_display_mode = "bet"
        }
    }
})
input.onButtonPressed(Button.B, function () {
    if (game_stage == GAME_STAGE_ROLE_SELECTION) {
        select_role(ROLE_PLAYER)
        game_stage = GAME_STAGE_FINDING_PLAYERS
    } else if (game_stage == GAME_STAGE_MY_TURN) {
        change_bet(1)
    } else if (game_stage == GAME_STAGE_PLAYING) {
        if (role == ROLE_DEALER) {
            show_pot()
        }
    }
})
input.onGesture(Gesture.Shake, function () {
    if (game_stage == GAME_STAGE_MY_TURN) {
        call_bet_raise()
    }
})
function add_board_cards (count: number) {
    for (let index = 0; index < count; index++) {
        _card = scrambled_cards.pop()
        board_cards.push(_card)
        console.log(_card)
    }
    board_cards_string = ""
    for (let i = 0; i <= board_cards.length - 1; i++) {
        board_cards_string = "" + board_cards_string + board_cards[i] + " "
    }
    if (board_cards.length == 0) {
        board_cards_string = "-"
    }
}
function msg_recieved_player (sender: number, msg_kind: number, msg_contents: string) {
    if (msg_kind == MSG_PLAYER_LOSE_GAME) {
        console.log("player lossed")
game_over = true
        return
    }
    if (game_stage == GAME_STAGE_FINDING_PLAYERS && msg_kind == MSG_JOIN_GAME_PING) {
        game_stage = GAME_STAGE_WAITING_FOR_GAME_TO_START
        dealer_id = sender
        console.log("sending player join confirm: ")
console.log("gamestate: " + game_stage)
send_message(0, MSG_PLAYER_JOIN_CONFIRM, "")
    } else if (msg_kind == MSG_START_GAME && game_stage == GAME_STAGE_WAITING_FOR_GAME_TO_START) {
        game_stage = GAME_STAGE_PLAYING
    } else if (msg_kind == MSG_PLAYER_START_TURN) {
        game_stage = GAME_STAGE_MY_TURN
        led.stopAnimation()
        highest_bet = parseInt(msg_contents)
        if (highest_bet > money) {
            bet = money
        } else {
            bet = highest_bet
        }
    }
    if (msg_kind == MSG_GIVE_HAND) {
        my_cards[0] = msg_contents.substr(0, 2)
        my_cards[1] = msg_contents.substr(3, 5)
    }
}
function select_role (selected_role: number) {
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
function next_round () {
    players_left_to_call = players.length - players_folded.length
    current_player = 0
    highest_bet = 0
    console.log("next round index: " + round_index)
if (players.length - players_folded.length == 1) {
        //pay_winner()
        //round_index = 0
    }
    if (round_index == 0) {
        console.log("round 0")
deal_cards()
        round_index += 1
    } else if (round_index == 1) {
        console.log("adding cards")
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
        pay_winner()
        if (players.length == 1) {
        	
        }
    }
    show_board_cards()
    send_message(players[0], MSG_PLAYER_START_TURN, "" + highest_bet)
}
function orderValues (values_array: number[]) {
    let card_groups2: number[] = []
    h = 1
    for (let k = 0; k <= values_array.length - 1; k++) {
        for (let l = 0; l <= values_array.length - k - 1 - 1; l++) {
            if (values_array[l] < values_array[l + 1]) {
                let global_hand_array: number[] = []
                spare_value2 = values_array[l]
                values_array[l] = values_array[l + 1]
                values_array[l + 1] = spare_value2
                spare_card2 = global_hand_array[l]
                global_hand_array[l] = global_hand_array[l + 1]
                global_hand_array[l + 1] = spare_card2
            }
        }
    }
    for (let m = 0; m <= values_array.length - 1; m++) {
        next2 = values_array[m + 1]
        if (next2 != undefined) {
            if (values_array[m] == next2 + 1) {
                current2 += 1
                if (current2 > row2) {
                    row2 = current2
                }
            } else if (values_array[m] != next2) {
                current2 = 0
            }
            if (values_array[m] == next2) {
                h += 1
            } else {
                if (h > 1) {
                    card_groups2.push(h)
                }
                h = 1
            }
        } else {
            if (h > 1) {
                card_groups2.push(h)
            }
        }
    }
    if (row2 >= 4) {
        return [row2]
    } else {
        return card_groups2
    }
}
let row2 = 0
let current2 = 0
let next2 = 0
let spare_card2 = 0
let spare_value2 = 0
let h = 0
let _display_char = ""
let my_cards: string[] = []
let game_over = false
let pot = 0
let players_folded: number[] = []
let _bet = 0
let _player_index = 0
let _player_id = 0
let MSG_PLAYER_LOSE_GAME = 0
let MSG_PLAYER_JOIN_CONFIRM = 0
let MSG_SEARCHING_FOR_PLAYERS = 0
let MSG_PLAYER_START_TURN = 0
let GAME_STAGE_FINISHED = 0
let GAME_STAGE_WAITING_FOR_GAME_TO_START = 0
let j = 0
let highest_bet = 0
let bet = 0
let MSG_START_GAME = 0
let MSG_GIVE_HAND = 0
let player_cards: string[][] = []
let ROLE_PLAYER = 0
let _contents = ""
let _kind = 0
let _sender = 0
let _reciever = 0
let same_suits = false
let index23 = 0
let first_suit = ""
let role = 0
let MSG_JOIN_GAME_PING = 0
let GAME_STAGE_FINDING_PLAYERS = 0
let ROLE_DEALER = 0
let GAME_STAGE_MY_TURN = 0
let _last_delimeter_index = 0
let _delimeters_found_kind = 0
let _delimeters_found_contents = 0
let card_values: number[] = []
let card_values_alpha: string[] = []
let suits: string[] = []
let global_suits : string[] = []
let GAME_STAGE_PLAYING = 0
let MSG_PLAYER_FINISH_TURN = 0
let dealer_id = 0
let _value = ""
let _rand = 0
let cards: string[] = []
let _temp_cards: string[] = []
let scrambled_cards: string[] = []
let GAME_STAGE_ROLE_SELECTION = 0
let serial_number = 0
let money = 0
let dealer_display_mode = ""
let board_cards_string = ""
let player_display_mode = ""
let players_left_to_call = 0
let player_money: number[] = []
let players: number[] = []
let _message = ""
let game_stage = 0
let result = ""
let combos: number[] = []
let card_groups: number[] = []
let round_index = 0
let searching_for_players = 0
let _message2 = ""
let board_cards: string[] = []
let _card_1 = ""
let _card_2 = ""
let _card = ""
let value = ""
let flush = false
let v_result = 0
let straight = 0
let g = 0
let same_suits2 = false
let index22 = 0
let result2 = ""
let spare_value = 0
let spare_card = 0
let next = 0
let current = 0
let row = 0
let current_player = 0
let straight2 = 0
let v_result2: number[] = []
let global_hand_array: string[] = []
let flush2 = false
let value2 = ""

player_display_mode = "cards"
board_cards_string = "-"
dealer_display_mode = "cards"
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
        if (!(game_over)) {
            if (game_stage == GAME_STAGE_MY_TURN) {
                if (player_display_mode == "bet") {
                    basic.showNumber(bet)
                } else if (player_display_mode == "cards" && my_cards.length == 2) {
                    basic.showString("" + my_cards[0] + my_cards[1])
                }
            } else if (game_stage == GAME_STAGE_PLAYING && my_cards.length == 2) {
                basic.showString("" + my_cards[0] + my_cards[1])
            }
        } else {
            led.stopAnimation()
            basic.showString("L")
        }
    } else if (role == ROLE_DEALER) {
        if (game_stage == GAME_STAGE_PLAYING) {
            if (dealer_display_mode == "cards") {
                basic.showString(board_cards_string)
            } else if (dealer_display_mode == "pot") {
                basic.showNumber(pot)
            }
        }
    }
})
function checkHand(hand: string[]) {
    let hand_values: number[] = []
    let hand_suits: string[] = []
    for (let card2 of hand) {
        value2 = card2.substr(0, 1)
        if (value2 == "X") {
            value2 = "10"
        } else if (value2 == "J") {
            value2 = "11"
        } else if (value2 == "Q") {
            value2 = "12"
        } else if (value2 == "K") {
            value2 = "13"
        } else if (value2 == "A") {
            value2 = "14"
        }
        hand_suits.push(card2.substr(1, 1))
        hand_values.push(parseFloat(value2))
    }
    global_suits = hand_suits
    flush2 = checkSuits()
    global_hand_array = hand
    v_result2 = orderValues(hand_values)
    if (v_result2[0] == 4) {
        straight2 = 4
    }
    if (flush2 && straight2 == 4) {
        result2 = "Straight Flush"
    } else if (flush2) {
        result2 = "Flush!"
    } else if (straight2 == 4) {
        result2 = "Straight"
    } else {
        result2 = "High Card"
    }
    if (v_result2.length == 1) {
        if (v_result2[0] == 1) {
            result2 = "One Pair"
        } else if (v_result2[0] == 2) {
            result2 = "Three of a kind"
        } else if (v_result2[0] == 3) {
            result2 = "Four of a kind"
        }
    } else if (v_result2.length == 2) {
        if (v_result2[0] == 2 && v_result2[1] == 2) {
            result2 = "Two Pair"
        }
        if (v_result2[0] == 2 && v_result2[1] == 3 || v_result2[0] == 3 && v_result2[1] == 2) {
            result2 = "Full House"
        }
    }
    return result2
}
