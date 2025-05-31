# pool_manager.py

class PoolManager:
    def __init__(self, initial_pool=100000):
        self.pool = initial_pool
        self.min_bet = 5
        self.max_bet = 500
        self.bust_bonus_ratio = 0.1 
        
    def can_place_bet(self, amount):
        return self.min_bet <= amount <= self.max_bet

    def calculate_payout(self, result, amount):
        if result == "blackjack":
            payout = amount * 2.5
        elif result == "win":
            payout = amount * 2
        elif result == "push":
            payout = amount
        else:
            payout = 0
        return min(payout, self.pool)

    def apply_bust_bonus(self, amount):
        bonus = amount * self.bust_bonus_ratio
        return min(bonus, self.pool)

    def update_pool_after_payout(self, payout):
        self.pool -= payout

    def update_pool_after_loss(self, bet):
        self.pool += bet

    def get_pool_balance(self):
        return self.pool
pool_instance = PoolManager(initial_pool=100000)


class PoolManager:
    def __init__(self, initial_pool=100000):
        self.pool = initial_pool
        self.initial_pool = initial_pool  
        self.min_bet = 5
        self.max_bet = 500
        self.bust_bonus_ratio = 0.1
        self.notification_threshold = 50000  
        self.notification_sent = False  

    def check_pool_level(self):
        """Check if pool level is below threshold and return status"""
        if self.pool <= self.notification_threshold and not self.notification_sent:
            self.notification_sent = True
            return {
                "needs_refill": True,
                "current_pool": self.pool,
                "initial_pool": self.initial_pool
            }
        return {"needs_refill": False}

    def refill_pool(self):
        """Refill the pool to its initial level"""
        self.pool = self.initial_pool
        self.notification_sent = False
        return self.pool
