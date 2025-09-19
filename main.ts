function get_best_hand_score (player_cards: string[]) {
    _all_cards = []
    _best_hand = []
    _best_score = 0
    if (player_cards.length != 2) {
        basic.showString("ERROR NOT 2 CARDS")
    }
    if (board_cards.length != 5) {
        basic.showString("ERROR BOARD CARDS: " + board_cards.length)
    }
    for (let _card2 of board_cards) {
        _all_cards.push(_card2)
    }
    _all_cards.push(player_cards[0])
    _all_cards.push(player_cards[1])
    for (let p = 0; p <= _all_cards.length - 4 - 1; p++) {
        for (let q = 0; q <= _all_cards.length - 3 - 1; q++) {
            if (q < p + 1) {
                q = p + 1
            }
            for (let r = 0; r <= _all_cards.length - 2 - 1; r++) {
                if (r < q + 1) {
                    r = q + 1
                }
                for (let s = 0; s <= _all_cards.length - 1 - 1; s++) {
                    if (s < r + 1) {
                        s = r + 1
                    }
                    for (let t = 0; t <= _all_cards.length - 1; t++) {
                        if (t < s + 1) {
                            t = s + 1
                        }
                        hand = [
                        _all_cards[p],
                        _all_cards[q],
                        _all_cards[r],
                        _all_cards[s],
                        _all_cards[t]
                        ]
                        score2 = checkHand(hand)
                        if (score2 > _best_score) {
                            _best_score = score2
                            _best_hand = hand
                        }
                    }
                }
            }
        }
    }
    return _best_score
}
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
    basic.showString("FOLD")
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
    if (_message.length > 19) {
        led.stopAnimation()
        basic.showString("E: " + _message)
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
function checkSuits () {
    first_suit = global_suits[0]
    index222 = 1
    same_suits2 = true
    while (same_suits2 == true && index222 < global_suits.length) {
        if (first_suit == global_suits[index222]) {
            index222 += 1
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
    o = 0
    for (let suit of suits) {
        for (let card_value of card_values) {
            cards.push("" + card_value + suit)
            o += 1
        }
        for (let card_value2 of card_values_alpha) {
            cards.push("" + card_value2 + suit)
            o += 1
        }
    }
}
function add_player (player_id: number) {
    players.push(player_id)
    player_money.push(money)
    player_cards.push([])
}
function call_bet_raise () {
    game_stage = GAME_STAGE_PLAYING
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
    MSG_PLAYER_WIN_ROUND = 8
    MSG_PLAYER_ROUND_OVER = 9
    MSG_PLAYER_REJOIN = 10
    HAND_HIGH_CARD = 0
    HAND_PAIR = 1
    HAND_TWO_PAIR = 2
    HAND_THREE_OF_A_KIND = 3
    HAND_STRAIGHT = 4
    HAND_FLUSH = 5
    HAND_FULL_HOUSE = 6
    HAND_FOUR_OF_A_KIND = 7
    HAND_STRAIGHT_FLUSH = 8
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
            _player_id = radio.receivedPacket(RadioPacketProperty.SerialNumber)
            _player_index = get_player_index(_player_id)
            if (_player_index != current_player) {
                return
            }
            _bet = parseInt(msg_contents)
            if (_bet == -1) {
                players_folded.push(_player_id)
                players_left_to_call = players_left_to_call - 1
                if(players.length - players_folded.length == 1){
                    next_round()
                    return
                }
            } else {
                _new_bet = _bet
                for (let _index = 0; _index <= already_paid_players.length - 1; _index++) {
                    if (_player_index == already_paid_players[_index]) {
                        _player_has_paid = true
                        _new_bet = _bet - already_paid_money[_index]
                        already_paid_money[_index] = _bet
                        break;
                    }
                }
                if (!(_player_has_paid)) {
                    already_paid_players.push(_player_index)
                    already_paid_money.push(_new_bet)
                }
                pot += _new_bet
                player_money[_player_index] = player_money[_player_index] - _bet
                if (_bet > highest_bet) {
                    highest_bet = parseInt(msg_contents)
                    players_left_to_call = players.length - 1
                } else {
                    players_left_to_call = players_left_to_call - 1
                }
            }
            _should_keep_checking = true
            while (_should_keep_checking) {
                _has_folded = false
                if (current_player == players.length - 1) {
                    current_player = 0
                } else {
                    current_player += 1
                }
                for (let _s = 0; _s <= players_folded.length - 1; _s++) {
                    if (players[current_player] == players_folded[_s]) {
                        _has_folded = true
                        break;
                    }
                }
                if (_has_folded) {
                    continue;
                }
                _should_keep_checking = false
            }
            if (players_left_to_call > 0) {
                send_message(players[current_player], MSG_PLAYER_START_TURN, "" + highest_bet)
            } else {
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
    round_index = 0
    best_hand_score = -1
    if (players.length - players_folded.length <= 1) {
        for (let _a = 0; _a <= players.length - 1; _a++) {
            _is_winner = true
            for (let index = 0; index < players_folded.length; index++) {
                if (players[_a] == players_folded[index]){
                    _is_winner = false
                    break;
                }
            }
            if (_is_winner) {
                _winner = _a
            }
        }
    } else {
        for (let i = 0; i <= players.length - 1; i++) {
            for (let j = 0; j <= players_folded.length - 1; j++) {
                if (players_folded[j] == players[i]) {
                    player_folded = true
                    break;
                }
            }
            if (player_folded) {
                continue;
            }
            score = get_best_hand_score(player_cards[i])
            if (score > best_hand_score) {
                _winner = i
            }
        }
    }
    players_folded = []
    board_cards = []
    board_cards_string = "-"
    player_money[_winner] = player_money[_winner] + pot
    send_message(players[_winner], MSG_PLAYER_WIN_ROUND, "" + player_money[_winner])
    pot = 0
    for (let index22 = 0; index22 <= players.length - 1; index22++) {
        if (player_money[index22] == 0) {
            send_message(players[index22], MSG_PLAYER_LOSE_GAME, "")
            players.removeAt(index22)
            player_money.removeAt(index22)
        } else {
            if (index22 == _winner) {
                continue;
            }
            send_message(players[index22], MSG_PLAYER_ROUND_OVER, "" + player_money[index22])
        }
    }
    game_over = true
    led.stopAnimation()
    basic.showString("ROUND OVER")
}
input.onButtonPressed(Button.AB, function () {
    led.stopAnimation()
    if (game_stage == GAME_STAGE_FINDING_PLAYERS) {
        if (role == ROLE_DEALER) {
            if (players.length == 0) {
            	
            }
            start_game()
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
    }
    board_cards_string = ""
    for (let k = 0; k <= board_cards.length - 1; k++) {
        board_cards_string = "" + board_cards_string + board_cards[k] + " "
    }
    if (board_cards.length == 0) {
        board_cards_string = "-"
    }
}
function msg_recieved_player (sender: number, msg_kind: number, msg_contents: string) {
    if (msg_kind == MSG_PLAYER_WIN_ROUND) {
        led.stopAnimation()
        money = parseInt(msg_contents)
        my_cards = []
        game_stage = GAME_STAGE_PLAYING
        basic.showString("W TOT:" + msg_contents)
    }
    if (msg_kind == MSG_PLAYER_ROUND_OVER) {
        led.stopAnimation()
        money = parseInt(msg_contents)
        my_cards = []
        game_stage = GAME_STAGE_PLAYING
        basic.showString("ROUND OVER: " + msg_contents)
    }
    if (msg_kind == MSG_PLAYER_LOSE_GAME) {
        game_over = true
        return
    }
    if (game_stage == GAME_STAGE_FINDING_PLAYERS && msg_kind == MSG_JOIN_GAME_PING) {
        game_stage = GAME_STAGE_WAITING_FOR_GAME_TO_START
        dealer_id = sender
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
        player_display_mode = "bet"
    }
    if (msg_kind == MSG_GIVE_HAND) {
        my_cards[0] = msg_contents.substr(0, 2)
        my_cards[1] = msg_contents.substr(3, 5)
    }
}
function checkHand (hand: string[]) {
    let hand_suits: string[] = []
    hand_values = []
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
    straight2 = 0
    v_result2 = orderValues(hand_values)
    if (v_result2.length == 5) {
        if (v_result2[4] == 4) {
            straight2 = 4
        }
    }
    if (flush2 && straight2 == 4) {
        result2 = HAND_STRAIGHT_FLUSH
    } else if (flush2) {
        result2 = HAND_FLUSH
    } else if (straight2 == 4) {
        result2 = HAND_STRAIGHT
    } else {
        result2 = HAND_HIGH_CARD
    }
    if (v_result2.length == 1) {
        if (v_result2[0] == 1) {
            result2 = HAND_HIGH_CARD
        } else if (v_result2[0] == 2) {
            result2 = HAND_PAIR
        } else if (v_result2[0] == 3) {
            result2 = HAND_THREE_OF_A_KIND
        } else if (v_result2[0] == 4) {
            result2 = HAND_FOUR_OF_A_KIND
        }
    } else if (v_result2.length == 2) {
        if (v_result2[0] == 2 && v_result2[1] == 2) {
            result2 = HAND_TWO_PAIR
        }
        if (v_result2[0] == 2 && v_result2[1] == 3 || v_result2[0] == 3 && v_result2[1] == 2) {
            result2 = HAND_FULL_HOUSE
        }
    }
    return result2
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
    already_paid_money = []
    already_paid_players = []
    current_player = 0
    _should_keep_checking2 = true
    while (_should_keep_checking2) {
        if (current_player > players.length) {
            break;
        }
        for (let _s2 = 0; _s2 <= players_folded.length - 1; _s2++) {
            if (players[current_player] == players_folded[_s2]) {
                current_player += 1
                continue;
            }
        }
        _should_keep_checking2 = false
    }
    highest_bet = 0
    if (players.length - players_folded.length == 1) {
        pay_winner()
        return
    } else {
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
            pay_winner()
            return
        }
    }
    show_board_cards()
    send_message(players[0], MSG_PLAYER_START_TURN, "" + highest_bet)
}
function orderValues (values_array: number[]) {
    let card_groups2: number[] = []
    h = 1
    spare_value2 = 0
    spare_card2 = ""
    for (let l = 0; l <= values_array.length - 1; l++) {
        for (let m = 0; m <= values_array.length - l - 1 - 1; m++) {
            if (values_array[m] < values_array[m + 1]) {
                spare_value2 = values_array[m]
                values_array[m] = values_array[m + 1]
                values_array[m + 1] = spare_value2
                spare_card2 = global_hand_array[m]
                global_hand_array[m] = global_hand_array[m + 1]
                global_hand_array[m + 1] = spare_card2
            }
        }
    }
    row2 = 0
    current2 = 0
    h = 1
    for (let n = 0; n <= values_array.length - 1; n++) {
        next2 = values_array[n + 1]
        if (n + 1 < values_array.length) {
            if (values_array[n] == next2 + 1) {
                current2 += 1
                if (current2 > row2) {
                    row2 = current2
                }
            } else if (values_array[n] != next2) {
                current2 = 0
            }
            if (values_array[n] == next2) {
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
        return [
        0,
        0,
        0,
        0,
        row2
        ]
    } else {
        return card_groups2
    }
}
let next2 = 0
let current2 = 0
let row2 = 0
let spare_card2 = ""
let spare_value2 = 0
let h = 0
let round_index = 0
let _should_keep_checking2 = false
let _display_char = ""
let result2 = 0
let v_result2: number[] = []
let straight2 = 0
let global_hand_array: string[] = []
let flush2 = false
let value2 = ""
let hand_values: number[] = []
let my_cards: string[] = []
let game_over = false
let _card = ""
let score = 0
let player_folded = false
let _winner = 0
let _is_winner = false
let best_hand_score = 0
let _has_folded = false
let _should_keep_checking = false
let pot = 0
let already_paid_money: number[] = []
let _player_has_paid = false
let already_paid_players: number[] = []
let _new_bet = 0
let players_left_to_call = 0
let players_folded: number[] = []
let _bet = 0
let current_player = 0
let _player_index = 0
let _player_id = 0
let HAND_STRAIGHT_FLUSH = 0
let HAND_FOUR_OF_A_KIND = 0
let HAND_FULL_HOUSE = 0
let HAND_FLUSH = 0
let HAND_STRAIGHT = 0
let HAND_THREE_OF_A_KIND = 0
let HAND_TWO_PAIR = 0
let HAND_PAIR = 0
let HAND_HIGH_CARD = 0
let MSG_PLAYER_REJOIN = 0
let MSG_PLAYER_ROUND_OVER = 0
let MSG_PLAYER_WIN_ROUND = 0
let MSG_PLAYER_LOSE_GAME = 0
let MSG_PLAYER_JOIN_CONFIRM = 0
let MSG_SEARCHING_FOR_PLAYERS = 0
let MSG_PLAYER_START_TURN = 0
let GAME_STAGE_FINISHED = 0
let GAME_STAGE_WAITING_FOR_GAME_TO_START = 0
let player_money: number[] = []
let o = 0
let highest_bet = 0
let bet = 0
let MSG_START_GAME = 0
let MSG_GIVE_HAND = 0
let player_cards: string[][] = []
let players: number[] = []
let ROLE_PLAYER = 0
let _contents = ""
let _kind = 0
let _sender = 0
let _reciever = 0
let same_suits2 = false
let index222 = 0
let global_suits: string[] = []
let first_suit = ""
let role = 0
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
let score2 = 0
let hand: string[] = []
let board_cards: string[] = []
let _best_score = 0
let _best_hand: string[] = []
let _all_cards: string[] = []
let GAME_STAGE_ROLE_SELECTION = 0
let game_stage = 0
let serial_number = 0
let money = 0
let dealer_display_mode = ""
let board_cards_string = ""
let player_display_mode = ""
let _combinations: number[] = []
let has_folded = false
let same_suits = false
let index23 = 0
let result = ""
let combos: number[] = []
let card_groups: number[] = []
let searching_for_players = 0
let _message2 = ""
let _card_1 = ""
let _card_2 = ""
let value = ""
let flush = false
let v_result = 0
let straight = 0
let g = 0
let spare_value = 0
let spare_card = 0
let next = 0
let current = 0
let row = 0
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
                    if (my_cards == []){
                        basic.showString("-")
                    } else {
                        basic.showString("" + my_cards[0] + my_cards[1])
                    }
                }
            } else if (game_stage == GAME_STAGE_PLAYING && my_cards.length == 2) {
                basic.showString("" + my_cards[0] + my_cards[1])
            }
        } else {
            led.stopAnimation()
            basic.showString("L")
        }
    } else if (role == ROLE_DEALER) {
        if (game_over) {
            basic.pause(10000)
            game_over = false
            next_round()
        }
        if (game_stage == GAME_STAGE_PLAYING) {
            if (dealer_display_mode == "cards") {
                basic.showString(board_cards_string)
            } else if (dealer_display_mode == "pot") {
                basic.showNumber(pot)
            }
        }
    }
})
