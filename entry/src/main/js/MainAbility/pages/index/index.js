import sensor from '@system.sensor';

const LABEL_VALUES = [0, 45, 90, 45];

export default {
    data: {
        currentAngle:0,
        canvasW: 454,
        canvasH: 454,
        lastDrawTime: 0
    },

    onInit() {
        this.startSensor();
    },

    onShow() {
        this.canvasEl = this.$refs.dialCanvas;
        this.ctx = this.canvasEl.getContext('2d');
        this.drawStatic();
        this.drawDynamic();
    },

    onDestroy() {
        this.stopSensor();
    },

    startSensor() {
        try {
            sensor.subscribeAccelerometer({
                interval: 'normal',
                success: (data) => {
                    const { x, y, z } = data;
                    // atan2(y, z) gives a continuous -180..+180 range as the watch
                    // rotates fully, instead of folding back past ±90 degrees
                    const pitchRad = Math.atan2(y, z);
                    const pitchDeg = pitchRad * (180 / Math.PI);
                    this.currentAngle = pitchDeg;

                    const now = Date.now();
                    if (now - this.lastDrawTime > 2000) {
                        this.lastDrawTime = now;
                        this.drawStatic();
                        this.drawDynamic();
                    }
                },
                fail: (data, code) => {
                    // Sensor error - keep last known angle
                }
            });
        } catch (e) {
            // Sensor not available
        }
    },

    stopSensor() {
        try {
            sensor.unsubscribeAccelerometer();
        } catch (e) {
            // no-op
        }
    },

    // --- Static background: bezel, ticks, labels - drawn ONCE ---------

    drawStatic() {
        const ctx = this.ctx;
        if (!ctx) {
		return;
		}
        const w = this.canvasW;
        const h = this.canvasH;
        const cx = w / 2;
        const cy = h / 2;
        const outerRadius = 220;
        const innerRadius = 205;

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, w, h);

        // Outer bezel ring
        ctx.beginPath();
        ctx.arc(cx, cy, outerRadius, 0, 2 * Math.PI);
        ctx.fillStyle = '#3A3A3A';
        ctx.fill();

        // Inner dial face
        ctx.beginPath();
        ctx.arc(cx, cy, innerRadius, 0, 2 * Math.PI);
        ctx.fillStyle = '#1C1C1C';
        ctx.fill();

        const angleOffset = 180; // 0deg starts at left, clockwise

        ctx.beginPath();
        for (let deg = 0; deg < 360; deg += 15) {
            if (deg % 45 === 0){ continue; } // major ticks drawn separately below
            const rad = (deg + angleOffset) * (Math.PI / 180);
            const x1 = cx + (innerRadius - 2) * Math.cos(rad);
            const y1 = cy + (innerRadius - 2) * Math.sin(rad);
            const x2 = cx + (innerRadius - 12) * Math.cos(rad);
            const y2 = cy + (innerRadius - 12) * Math.sin(rad);
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
        }
        ctx.strokeStyle = '#666666';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        for (let deg = 0; deg < 360; deg += 45) {
            const rad = (deg + angleOffset) * (Math.PI / 180);
            const x1 = cx + (innerRadius - 2) * Math.cos(rad);
            const y1 = cy + (innerRadius - 2) * Math.sin(rad);
            const x2 = cx + (innerRadius - 24) * Math.cos(rad);
            const y2 = cy + (innerRadius - 24) * Math.sin(rad);
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
        }
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Major labels every 45 degrees, cycling through 0-45-90 pattern
        const labelRadius = innerRadius - 45;
        ctx.font = '20px';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        let labelIndex = 0;
        for (let deg = 0; deg < 360; deg += 45) {
            const rad = (deg + angleOffset) * (Math.PI / 180);
            const x = cx + labelRadius * Math.cos(rad);
            const y = cy + labelRadius * Math.sin(rad);
            const label = LABEL_VALUES[labelIndex % 4];
            ctx.fillText(String(label), x, y);
            labelIndex++;
        }
    },

    drawDynamic() {
        const ctx = this.ctx;
        if (!ctx){ return;}
        const cx = this.canvasW / 2;
        const cy = this.canvasH / 2;
        const innerRadius = 205;
        const angleOffset = 180;

        // Red needle
        const needleRad = (this.currentAngle + angleOffset) * (Math.PI / 180);
        const needleInnerRadius = 70;
        const needleOuterRadius = innerRadius - 60;

        const needleStartX = cx + needleInnerRadius * Math.cos(needleRad);
        const needleStartY = cy + needleInnerRadius * Math.sin(needleRad);
        const needleEndX = cx + needleOuterRadius * Math.cos(needleRad);
        const needleEndY = cy + needleOuterRadius * Math.sin(needleRad);

        ctx.beginPath();
        ctx.moveTo(needleStartX, needleStartY);
        ctx.lineTo(needleEndX, needleEndY);
        ctx.strokeStyle = '#FF3333';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Center digital angle value
        ctx.font = '48px';
        ctx.fillStyle = '#FF3333';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.currentAngle.toFixed(0) + '°', cx, cy - 15);
    }
};