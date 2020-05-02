package obj

// MaxObj is Object Max length
var MaxObj = 4

// Quadtree is
type Quadtree struct {
	x       float64
	y       float64
	w       float64
	h       float64
	level   int
	objects []*Object
	nodes   []Quadtree
}

// NewQuadtree is
func NewQuadtree(x, y, w, h float64, level int) *Quadtree {
	q := Quadtree{
		x:       x,
		y:       y,
		w:       w,
		h:       h,
		level:   level,
		objects: []*Object{},
		nodes:   nil,
	}
	return &q
}

// split is
func (q *Quadtree) split() {
	xx := [4]float64{0, 1, 0, 1}
	yy := [4]float64{0, 0, 1, 1}
	q.nodes = make([]Quadtree, 4)
	for i := 0; i < 4; i++ {
		q.nodes[i] = *NewQuadtree(
			q.x+xx[i]*q.w/2,
			q.y+yy[i]*q.h/2,
			q.w/2,
			q.h/2,
			q.level+1,
		)
	}
}

// getIndex is
func (q Quadtree) getIndex(area Area) int {
	x := q.x + q.w/2
	y := q.y + q.h/2

	if area.X <= x && area.X+area.W >= x || area.Y <= y && area.Y+area.H >= y {
		return -1
	}
	// 1 0
	// 2 3
	if area.X > x {
		if area.Y > y {
			return 3
		}
		return 0
	}

	if area.Y > y {
		return 2
	}
	return 1
}

// Insert insert quadtree
func (q *Quadtree) Insert(obj *Object) {
	var index = -1

	if q.nodes != nil {
		index = q.getIndex(Area{
			X: obj.X - obj.R,
			Y: obj.Y - obj.R,
			W: obj.R * 2,
			H: obj.R * 2,
		})
		if index != -1 {
			q.nodes[index].Insert(obj)
			return
		}
	}

	q.objects = append(q.objects, obj)

	if len(q.objects) > MaxObj {
		if q.nodes == nil {
			q.split()
		}

		for i := 0; i < len(q.objects); {
			index = q.getIndex(Area{
				X: q.objects[i].X - q.objects[i].R,
				Y: q.objects[i].Y - q.objects[i].R,
				W: q.objects[i].R * 2,
				H: q.objects[i].R * 2,
			})
			if index != -1 {
				q.nodes[index].Insert(q.objects[i])
				q.objects[i] = q.objects[len(q.objects)-1]
				q.objects = q.objects[:len(q.objects)-1]
			} else {
				i++
			}
		}
	}
}

// RetrieveArea is
func (q Quadtree) Retrieve(area Area) []*Object {
	var index int = q.getIndex(area)
	var returnObjects []*Object = q.objects

	if q.nodes != nil {
		if index != -1 {
			for _, obj := range q.nodes[index].Retrieve(area) {
				returnObjects = append(returnObjects, obj)
			}
		} else {
			for i := 0; i < 4; i++ {
				for _, obj := range q.nodes[i].Retrieve(area) {
					returnObjects = append(returnObjects, obj)
				}
			}
		}
	}

	return returnObjects
}

// Clear is
func (q *Quadtree) Clear() {
	q.objects = nil

	if q.nodes != nil {
		for i := 0; i < 4; i++ {
			q.nodes[i].Clear()
		}
	}

	q.nodes = nil
}
