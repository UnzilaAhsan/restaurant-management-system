const User = require('../models/User');

// Get all staff (for admin)
exports.getStaff = async (req, res) => {
    try {
        const staff = await User.find({ 
            role: { $in: ['staff', 'admin'] } 
        }).select('-password');
        
        res.json(staff);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create staff (Admin only)
exports.createStaff = async (req, res) => {
    try {
        const { username, email, password, role, salary, rank, phone, address } = req.body;
        
        // Check if user exists
        const userExists = await User.findOne({ 
            $or: [{ email: email.toLowerCase() }, { username }] 
        });
        
        if (userExists) {
            return res.status(400).json({ 
                message: 'User with this email or username already exists' 
            });
        }

        // Create staff member
        const staff = await User.create({
            username,
            email: email.toLowerCase(),
            password,
            role: role || 'staff',
            salary: salary || 0,
            rank: rank || 'junior',
            phone,
            address,
            joinDate: new Date(),
            isActive: true
        });

        res.status(201).json({
            _id: staff._id,
            username: staff.username,
            email: staff.email,
            role: staff.role,
            salary: staff.salary,
            rank: staff.rank,
            phone: staff.phone,
            address: staff.address,
            joinDate: staff.joinDate,
            isActive: staff.isActive
        });
    } catch (error) {
        console.error('Create staff error:', error);
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        
        if (error.code === 11000) {
            return res.status(400).json({ 
                message: 'Duplicate field value entered' 
            });
        }
        
        res.status(500).json({ 
            message: 'Server error during staff creation' 
        });
    }
};

// Update staff (Admin only)
exports.updateStaff = async (req, res) => {
    try {
        const { salary, rank, isActive, phone, address } = req.body;
        
        const staff = await User.findByIdAndUpdate(
            req.params.id,
            {
                salary,
                rank,
                isActive,
                phone,
                address
            },
            { new: true, runValidators: true }
        ).select('-password');
        
        if (!staff) {
            return res.status(404).json({ message: 'Staff member not found' });
        }
        
        res.json(staff);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete staff (Admin only)
exports.deleteStaff = async (req, res) => {
    try {
        const staff = await User.findByIdAndDelete(req.params.id);
        
        if (!staff) {
            return res.status(404).json({ message: 'Staff member not found' });
        }
        
        res.json({ message: 'Staff member deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};