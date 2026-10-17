# MongoDB Computed Pattern for Doctor Earnings

To avoid expensive runtime aggregation pipelines (`$unwind` across nested patient appointments and treatments), the MongoDB strategy pre-computes yearly treatment cost totals directly on Doctor documents (`kosten_pro_jahr.<year>`). Every new treatment write in MongoDB atomically embeds the treatment in the Patient document and increments the doctor's pre-computed yearly earnings, allowing the Doctor Earnings Report to serve high-performance reads in O(1) time.
