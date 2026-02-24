import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { canManageDistribution } from "@/lib/distributionAuth";

const SCHEDULE_TYPES = ["today", "yesterday", "last_week", "custom", "all"];
const CLOTHING_TYPES = ["shirt_child", "shirt_adult", "pants_child", "pants_adult", "other"];

function startOfDay(d) {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d) {
  const x = new Date(d);
  x.setUTCHours(23, 59, 59, 999);
  return x;
}

/** Start of week (Monday) */
function startOfWeek(d) {
  const x = new Date(d);
  const day = x.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setUTCDate(x.getUTCDate() + diff);
  return startOfDay(x);
}

/** End of week (Sunday) */
function endOfWeek(d) {
  const x = new Date(d);
  const day = x.getUTCDay();
  const diff = day === 0 ? 0 : 7 - day;
  x.setUTCDate(x.getUTCDate() + diff);
  return endOfDay(x);
}

/** Today 00:00 and 23:59:59 */
function todayRange(now) {
  return { start: startOfDay(now), end: endOfDay(now) };
}

/** Yesterday 00:00 and 23:59:59 */
function yesterdayRange(now) {
  const y = new Date(now);
  y.setUTCDate(y.getUTCDate() - 1);
  return { start: startOfDay(y), end: endOfDay(y) };
}

/** All donations: from epoch to end of today */
function allRange(now) {
  return { start: new Date(0), end: endOfDay(now) };
}

/** Last week (previous Mon–Sun) */
function lastWeekRange(now) {
  const thisWeekStart = startOfWeek(now);
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setUTCDate(lastWeekStart.getUTCDate() - 7);
  const lastWeekEnd = endOfDay(new Date(lastWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000));
  return { start: lastWeekStart, end: lastWeekEnd };
}

/**
 * GET /api/admin/distributions
 * List all distributions. Requires canManageDistribution.
 */
export async function GET() {
  try {
    const session = await getSession();
    const canManage = await canManageDistribution(session);
    if (!canManage) {
      return NextResponse.json(
        { success: false, error: "ဝင်ရောက်ခွင့် မရှိပါ။" },
        { status: 403 }
      );
    }

    const client = await clientPromise;
    const db = client.db("FairShare");

    const distributions = await db
      .collection("distributions")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      distributions: distributions.map((d) => ({
        ...d,
        id: d._id.toString(),
      })),
    });
  } catch (e) {
    console.error("GET distributions error:", e);
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/distributions
 * Create a distribution. Body: { scheduleType, startDate, endDate, name? }
 */
export async function POST(req) {
  try {
    const session = await getSession();
    const canManage = await canManageDistribution(session);
    if (!canManage) {
      return NextResponse.json(
        { success: false, error: "ဝင်ရောက်ခွင့် မရှိပါ။" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { scheduleType, startDate, endDate, name } = body;

    if (!scheduleType || !SCHEDULE_TYPES.includes(scheduleType)) {
      return NextResponse.json(
        { success: false, error: "အချိန်ဇယား အမျိုးအစား မမှန်ကန်ပါ။ today, yesterday, last_week, custom သို့မဟုတ် all ဖြစ်ရမည်။" },
        { status: 400 }
      );
    }

    let startD;
    let endD;
    const now = new Date();

    if (scheduleType === "today") {
      const { start, end } = todayRange(now);
      startD = start;
      endD = end;
    } else if (scheduleType === "yesterday") {
      const { start, end } = yesterdayRange(now);
      startD = start;
      endD = end;
    } else if (scheduleType === "last_week") {
      const { start, end } = lastWeekRange(now);
      startD = start;
      endD = end;
    } else if (scheduleType === "all") {
      const { start, end } = allRange(now);
      startD = start;
      endD = end;
    } else {
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return NextResponse.json(
          { success: false, error: "စိတ်ကြိုက် ကာလအတွက် စတင်ရက် နှင့် ပြီးဆုံးရက် ထည့်သွင်းရန် လိုအပ်ပါသည်။" },
          { status: 400 }
        );
      }
      startD = startOfDay(start);
      endD = endOfDay(end);
      if (endD < startD) {
        return NextResponse.json(
          { success: false, error: "ပြီးဆုံးရက် သည် စတင်ရက် ထက် နောက်ကျရမည်။" },
          { status: 400 }
        );
      }
    }

    const client = await clientPromise;
    const db = client.db("FairShare");

    let shelters = await db
      .collection("hostels")
      .find({ "verification.status": "approved" })
      .project({ _id: 1, hostelName: 1, population: 1 })
      .toArray();

    if (shelters.length === 0) {
      return NextResponse.json(
        { success: false, error: "အတည်ပြုထားသော ဂေဟာ မရှိပါ။" },
        { status: 400 }
      );
    }

    // Exclude shelters with low reliability: need at least (total distributions - 2) posts
    const allDistributions = await db
      .collection("distributions")
      .find({})
      .project({ _id: 1, allocations: 1 })
      .toArray();

    const shelterIds = shelters.map((s) => s._id);
    const totalByShelter = {};
    const distIdsByShelter = {};
    shelterIds.forEach((sid) => {
      const sidStr = sid.toString();
      totalByShelter[sidStr] = 0;
      distIdsByShelter[sidStr] = [];
    });
    allDistributions.forEach((d) => {
      (d.allocations || []).forEach((a) => {
        const aid = a.shelterId?.toString?.();
        if (aid && distIdsByShelter[aid] !== undefined) {
          distIdsByShelter[aid].push(d._id);
          totalByShelter[aid]++;
        }
      });
    });

    const activitiesWithDist = await db
      .collection("activities")
      .find({
        shelterId: { $in: shelterIds },
        distributionId: { $exists: true, $ne: null },
      })
      .project({ shelterId: 1, distributionId: 1 })
      .toArray();

    const givenByShelter = {};
    shelterIds.forEach((sid) => {
      givenByShelter[sid.toString()] = 0;
    });
    activitiesWithDist.forEach((act) => {
      const sidStr = act.shelterId?.toString?.();
      const distSet = distIdsByShelter[sidStr];
      if (distSet && act.distributionId && distSet.some((did) => did.equals(act.distributionId))) {
        givenByShelter[sidStr]++;
      }
    });

    const minRequired = (total) => Math.max(0, total - 2);
    shelters = shelters.filter((sh) => {
      const sidStr = sh._id.toString();
      const total = totalByShelter[sidStr] || 0;
      const given = givenByShelter[sidStr] || 0;
      return given >= minRequired(total);
    });

    if (shelters.length === 0) {
      return NextResponse.json(
        { success: false, error: "ယုံကြည်စိတ်ချရမှု စံချိန်ပြည့်မီသော ဂေဟာ မရှိပါ။ (ဖြန့်ဝေမှု အရေအတွက် − ၂ ထက် လှုပ်ရှားမှု မတင်ထားသော ဂေဟာများ ချန်လှပ်ထားပါသည်)" },
        { status: 400 }
      );
    }

    const N = shelters.length;
    // Only donations that are approved and not yet in any distribution
    const allEligible = await db
      .collection("donations")
      .find({
        status: "approved",
        $or: [{ distributionId: { $exists: false } }, { distributionId: null }],
      })
      .toArray();

    // Include only donations whose approval/creation falls within the chosen duration (no other date filter)
    const donations = allEligible.filter((d) => {
      const effective = d.approvedAt || d.createdAt;
      if (!effective) return false;
      const eff = new Date(effective);
      return eff >= startD && eff <= endD;
    });

    const anyShelterHasPopulation = shelters.some(
      (sh) => (sh.population?.children ?? 0) + (sh.population?.adults ?? 0) > 0
    );
    // When no shelter has population, clothing is not included in the distribution (stays in donation pool)
    const donationIds = donations
      .filter((d) => d.category !== "clothing" || anyShelterHasPopulation)
      .map((d) => d._id);

    let totalMoney = 0;
    let totalPyi = 0;
    const foodItemsMap = {};
    const medicalItemsMap = {};
    const clothingSums = { shirt_child: 0, shirt_adult: 0, pants_child: 0, pants_adult: 0, other: 0 };

    for (const d of donations) {
      if (d.category === "money" && Number.isFinite(d.amount)) totalMoney += d.amount;
      if (d.category === "food") {
        if (Number.isFinite(d.totalPyi)) totalPyi += d.totalPyi;
        for (const it of d.foodItems || []) {
          const key = it.type + (it.label ? `:${it.label}` : "");
          foodItemsMap[key] = (foodItemsMap[key] || 0) + (parseInt(it.quantity, 10) || 0);
        }
      }
      if (d.category === "medical") {
        for (const it of d.medicalItems || []) {
          const key = it.type + (it.label ? `:${it.label}` : "");
          medicalItemsMap[key] = (medicalItemsMap[key] || 0) + (parseInt(it.quantity, 10) || 0);
        }
      }
      if (d.category === "clothing" && anyShelterHasPopulation) {
        for (const it of d.clothingItems || []) {
          if (CLOTHING_TYPES.includes(it.type)) {
            clothingSums[it.type] = (clothingSums[it.type] || 0) + (parseInt(it.quantity, 10) || 0);
          }
        }
      }
    }

    const totalChildren = shelters.reduce(
      (s, sh) => s + (sh.population?.children ?? 0),
      0
    );
    const totalAdults = shelters.reduce(
      (s, sh) => s + (sh.population?.adults ?? 0),
      0
    );
    const sheltersWithPopulation = shelters.filter(
      (sh) => (sh.population?.children ?? 0) + (sh.population?.adults ?? 0) > 0
    );
    const N_with_pop = sheltersWithPopulation.length;

    const moneyPerShelter = totalMoney / N;
    const pyiPerShelter = totalPyi / N;

    const foodItemsEntries = Object.entries(foodItemsMap).map(([key, qty]) => {
      const [type, label] = key.includes(":") ? key.split(":") : [key, undefined];
      return { type, label, totalQty: qty, perShelter: Math.floor(qty / N), remainder: qty % N };
    });
    const medicalItemsEntries = Object.entries(medicalItemsMap).map(([key, qty]) => {
      const [type, label] = key.includes(":") ? key.split(":") : [key, undefined];
      return { type, label, totalQty: qty, perShelter: Math.floor(qty / N), remainder: qty % N };
    });

    const allocations = shelters.map((sh) => {
      const adults = sh.population?.adults ?? 0;
      const children = sh.population?.children ?? 0;
      const hasPopulation = children + adults > 0;
      const childShare = totalChildren > 0 ? children / totalChildren : 0;
      const adultShare = totalAdults > 0 ? adults / totalAdults : 0;

      const otherPerShelterWithPop = N_with_pop > 0 ? Math.floor((clothingSums.other || 0) / N_with_pop) : 0;
      const otherRemainder = N_with_pop > 0 ? (clothingSums.other || 0) % N_with_pop : 0;
      const isFirstWithPop = sheltersWithPopulation[0] && sh._id.equals(sheltersWithPopulation[0]._id);

      const clothingAlloc = {
        shirt_child: hasPopulation ? Math.floor((clothingSums.shirt_child || 0) * childShare) : 0,
        pants_child: hasPopulation ? Math.floor((clothingSums.pants_child || 0) * childShare) : 0,
        shirt_adult: hasPopulation ? Math.floor((clothingSums.shirt_adult || 0) * adultShare) : 0,
        pants_adult: hasPopulation ? Math.floor((clothingSums.pants_adult || 0) * adultShare) : 0,
        other: hasPopulation ? otherPerShelterWithPop + (isFirstWithPop ? otherRemainder : 0) : 0,
      };

      const clothingItems = [
        { type: "shirt_child", quantity: clothingAlloc.shirt_child },
        { type: "pants_child", quantity: clothingAlloc.pants_child },
        { type: "shirt_adult", quantity: clothingAlloc.shirt_adult },
        { type: "pants_adult", quantity: clothingAlloc.pants_adult },
        { type: "other", quantity: clothingAlloc.other },
      ].filter((i) => i.quantity > 0);

      const isFirst = sh._id.equals(shelters[0]._id);
      const foodItems = foodItemsEntries.map(({ type, label, perShelter, remainder }) => {
        let q = perShelter;
        if (isFirst && remainder) q += remainder;
        if (q <= 0) return null;
        return { type, label, quantity: q };
      }).filter(Boolean);
      const medicalItems = medicalItemsEntries.map(({ type, label, perShelter, remainder }) => {
        let q = perShelter;
        if (isFirst && remainder) q += remainder;
        if (q <= 0) return null;
        return { type, label, quantity: q };
      }).filter(Boolean);

      return {
        shelterId: sh._id,
        shelterName: sh.hostelName || "အမည်မသိ",
        money: Math.round(moneyPerShelter * 100) / 100,
        food: { totalPyi: Math.round(pyiPerShelter * 100) / 100, items: foodItems },
        medical: { items: medicalItems },
        clothing: { items: clothingItems },
      };
    });

    const creationTime = new Date();
    const doc = {
      scheduleType,
      donationPeriodStart: startD,
      donationPeriodEnd: endD,
      startDate: creationTime,
      endDate: endD,
      name: name && String(name).trim() ? String(name).trim() : null,
      createdBy: new ObjectId(session.id),
      createdAt: creationTime,
      status: "draft",
      donationIds,
      allocations,
    };

    const result = await db.collection("distributions").insertOne(doc);

    // Draft: do not assign donations yet; admin will Confirm on detail page

    return NextResponse.json({
      success: true,
      distribution: {
        ...doc,
        _id: result.insertedId,
        id: result.insertedId.toString(),
      },
    });
  } catch (e) {
    console.error("POST distributions error:", e);
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}
